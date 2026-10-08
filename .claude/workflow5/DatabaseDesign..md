Bạn là Senior MongoDB Architect + Application Storage Architect.

Dựa trên:

- Product Discovery
- Learning System
- PRD/MVP
- System Architecture

hãy thiết kế Database + Storage Architecture cho IELTS learning platform.

Technology:

- MongoDB Atlas Free tier
- Mongoose
- ExpressJS

Mục tiêu rất quan trọng:

MongoDB Atlas Free tier hiện có giới hạn storage khoảng 512 MB.

Thiết kế phải ưu tiên tiết kiệm storage và tránh lưu binary media trong MongoDB.

==================================================

1. # STORAGE STRATEGY

Phân loại dữ liệu thành:

A. MongoDB data

- users
- learning profiles
- vocabulary
- lessons metadata
- questions
- progress
- reviews
- assessments
- recommendations

B. External media

- video
- audio
- large images
- PDF nếu cần

MongoDB chỉ lưu metadata + external URL/reference.

Không lưu video/audio binary trong MongoDB.

Không sử dụng GridFS cho MVP.

================================================== 2. MEDIA MODEL
==================================================

Thiết kế generic media object.

Ví dụ:

media: {
type,
provider,
url,
embedUrl,
thumbnailUrl,
duration
}

Provider có thể:

- youtube
- vimeo
- external
- self-hosted

Không hard-code hệ thống chỉ cho YouTube.

================================================== 3. DATABASE COLLECTIONS
==================================================

Thiết kế collections tối thiểu cần thiết cho MVP.

Phân biệt:

Static content
User state
Learning history
Derived data

Không duplicate dữ liệu không cần thiết.

================================================== 4. ADMIN CONTENT
==================================================

Hệ thống phải hỗ trợ Admin tạo và quản lý:

- Vocabulary
- Lessons
- Reading
- Listening
- Video
- Questions
- Topics
- Levels

Content lifecycle:

draft
→ published
→ archived

Không ưu tiên hard delete đối với learning content đã được user sử dụng.

================================================== 5. ADMIN CONTENT SCHEMAS
==================================================

Thiết kế schema cho:

Vocabulary
Lesson
Reading
Listening
Video
Question

Mỗi content phải có:

- title/name
- type
- level
- topic
- tags nếu cần
- status
- createdAt
- updatedAt

Chỉ thêm fields thực sự cần thiết.

================================================== 6. USER LEARNING DATA
==================================================

Thiết kế:

User
LearningProfile
VocabularyProgress
LearningSession
Review
Attempt
SkillProgress

Tối ưu để không tạo dữ liệu duplicate.

================================================== 7. STORAGE OPTIMIZATION
==================================================

Phân tích:

- document size
- index size
- duplication
- embedded vs referenced
- historical data
- aggregation
- retention

Không tạo index nếu query pattern không cần.

Đề xuất index cụ thể và giải thích lý do.

================================================== 8. QUERY PATTERNS
==================================================

Xác định các query quan trọng nhất:

- today's learning
- due reviews
- weak vocabulary
- user progress
- dashboard
- admin content list
- published lessons
- questions for lesson

Sau đó thiết kế indexes dựa trên query patterns.

================================================== 9. DATA RETENTION
==================================================

Thiết kế strategy cho learning history.

Không lưu detailed events vô hạn nếu không cần.

Phân biệt:

- current state
- aggregate statistics
- detailed history

Đề xuất retention strategy phù hợp với MVP.

================================================== 10. ADMIN DASHBOARD
==================================================

Thiết kế data requirements cho Admin Dashboard:

- total users
- total vocabulary
- total lessons
- total reading
- total listening
- total videos
- draft content
- published content
- archived content
- recent content

Admin phải có CRUD cho content.

================================================== 11. OUTPUT
==================================================

Output:

1. Storage architecture
2. Collection list
3. Schema
4. Relationships
5. Indexes
6. Query patterns
7. Media strategy
8. Admin content model
9. Retention strategy
10. Storage optimization strategy
11. Example documents
12. Expected storage growth

Mục tiêu là xây architecture có thể chạy lâu trên MongoDB Free tier cho một personal learning app mà không lãng phí storage.

Không thiết kế UI.
Không viết frontend code.
