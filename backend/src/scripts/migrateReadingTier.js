const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Vocabulary = require('../models/Vocabulary');
const wordLists = require('../data/word_lists.json');

const isDryRun = process.argv.includes('--dry-run');

const normalizeWordForLookup = (w) => {
  const clean = String(w || '').toLowerCase().trim().replace(/[*]/g, '');
  return wordLists.spellingVariants[clean] || clean;
};

const oxford500Set = new Set((wordLists.oxford500 || []).map(w => w.toLowerCase()));
const oxford3000Set = new Set((wordLists.oxford3000 || []).map(w => w.toLowerCase()));
const awlSet = new Set((wordLists.awl || []).map(w => w.toLowerCase()));

const determineNewTier = (word, doc) => {
  const norm = normalizeWordForLookup(word);

  // Priority 1: Oxford 500 (A1 foundational) -> Tier 1
  if (oxford500Set.has(norm)) return 1;

  // Priority 2: Oxford 3000 (A1-B2 general high-frequency) -> Tier 2
  if (oxford3000Set.has(norm)) return 2;

  // Priority 3: Academic Word List -> Tier 3
  if (awlSet.has(norm) || (doc && doc.awlSublist)) return 3;

  // Priority 4: Advanced / Domain Specific -> Tier 4
  return 4;
};

const runMigration = async () => {
  try {
    console.log(`[Migration] Starting readingTier migration (dryRun = ${isDryRun})...`);
    await connectDB();

    // 1. Check for unmigrated reading words
    const filter = {
      $or: [
        { topic: 'reading-538' },
        { vocabType: 'ielts_reading_538' }
      ],
      readingTier: null
    };

    const unmigratedWords = await Vocabulary.find(filter);

    if (unmigratedWords.length === 0) {
      console.log('[Migration] No unmigrated reading words found (readingTier == null is 0). Migration is already complete!');
      const counts = await Vocabulary.aggregate([
        { $match: { readingTier: { $ne: null } } },
        { $group: { _id: '$readingTier', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      console.log('[Migration] Current readingTier distribution:', counts);
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`[Migration] Found ${unmigratedWords.length} reading words to migrate.`);

    // 2. Strict validation on tier values before touching anything
    const tierCounts = { 1: 0, 2: 0, 3: 0, invalid: 0 };
    const invalidWords = [];

    for (const doc of unmigratedWords) {
      const t = Number(doc.tier);
      if ([1, 2, 3].includes(t)) {
        tierCounts[t]++;
      } else {
        tierCounts.invalid++;
        invalidWords.push({ word: doc.word, tier: doc.tier });
      }
    }

    console.log('[Migration] Raw tier distribution in unmigrated docs:', tierCounts);

    if (tierCounts.invalid > 0) {
      console.error('[Migration ERROR] Found words with tier outside [1, 2, 3]:', invalidWords);
      console.error('[Migration STOP] Halting migration to protect data integrity.');
      await mongoose.connection.close();
      process.exit(1);
    }

    if (unmigratedWords.length !== 376) {
      console.warn(`[Migration WARNING] Expected 376 reading words, but found ${unmigratedWords.length}.`);
    }

    // 3. Backup unmigrated data to JSON file
    const backupDir = path.resolve(__dirname, '../data');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `vocabularies_backup_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(unmigratedWords, null, 2), 'utf8');
    console.log(`[Migration] Backup saved successfully to: ${backupPath}`);

    // 4. Calculate new tier mapping
    const newTierDistribution = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const migrationOps = [];

    for (const doc of unmigratedWords) {
      const origTier = Number(doc.tier);
      const newGeneralTier = determineNewTier(doc.word, doc);
      newTierDistribution[newGeneralTier]++;

      migrationOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              readingTier: origTier,
              tier: newGeneralTier
            }
          }
        }
      });
    }

    console.log('[Migration] Planned readingTier (exam frequency) distribution: Tier 1:', tierCounts[1], 'Tier 2:', tierCounts[2], 'Tier 3:', tierCounts[3]);
    console.log('[Migration] Planned general tier (Oxford/AWL) distribution:', newTierDistribution);

    // 5. Execute or Dry-run
    if (isDryRun) {
      console.log('\n================ DRY RUN COMPLETED ================');
      console.log(`Matched records       : ${unmigratedWords.length}`);
      console.log(`Dry-run mode active   : NO DB CHANGES APPLIED.`);
      console.log('====================================================\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`[Migration] Executing bulkWrite for ${migrationOps.length} documents...`);
    const bulkRes = await Vocabulary.bulkWrite(migrationOps, { ordered: false });
    console.log(`[Migration] bulkWrite completed: modified = ${bulkRes.modifiedCount}`);

    // 6. Post-verification
    const postCounts = await Vocabulary.aggregate([
      { $match: { readingTier: { $ne: null } } },
      { $group: { _id: '$readingTier', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.log('[Migration] Verified readingTier distribution in DB:', postCounts);

    const isMatch = postCounts.every(p => {
      if (p._id === 1 && p.count === 20) return true;
      if (p._id === 2 && p.count === 100) return true;
      if (p._id === 3 && p.count === 256) return true;
      return false;
    });

    if (isMatch && postCounts.reduce((acc, c) => acc + c.count, 0) === 376) {
      console.log('[Migration SUCCESS] 100% verified: exactly 20 (Tier 1), 100 (Tier 2), 256 (Tier 3).');
    } else {
      console.warn('[Migration NOTICE] Completed, distribution:', postCounts);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('[Migration FATAL ERROR]:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

runMigration();
