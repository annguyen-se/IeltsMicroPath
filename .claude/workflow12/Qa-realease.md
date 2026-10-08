# WF12 — Integration, QA & Release

Bạn là Senior Full-Stack QA Engineer + Release Engineer.

Mục tiêu là kiểm tra toàn bộ IELTS Learning Application sau khi Backend và Frontend đã được implement.

Dựa trên:

- Product Requirements
- Learning System
- Database Design
- Backend API Contract
- OpenDesign
- Frontend Architecture
- Implementation Roadmap
- Backend Implementation
- Frontend Implementation

---

# 1. FULL SYSTEM TEST

Kiểm tra toàn bộ application:

Student:

- Register
- Login
- Dashboard
- Daily Learning
- Vocabulary
- Review
- Reading
- Listening
- Progress
- Profile

Admin:

- Login
- Dashboard
- Content
- Create
- Edit
- Preview
- Publish
- Archive

---

# 2. API INTEGRATION

Kiểm tra:

- request
- response
- status codes
- authentication
- authorization
- validation
- error handling

Đảm bảo Frontend sử dụng đúng Backend Contract.

---

# 3. DATABASE

Kiểm tra:

- data integrity
- references
- validation
- indexes
- duplicate data
- orphan data

Đặc biệt kiểm tra MongoDB Free tier:

- unnecessary indexes
- unnecessary duplicated data
- large documents
- media binary
- unbounded history

Video/audio phải tiếp tục sử dụng external URLs.

---

# 4. AUTHORIZATION

Test:

### Anonymous

Không truy cập private resources.

### Student

Không truy cập admin API/UI.

### Admin

Có thể truy cập admin functionality.

### Expired session

Redirect hoặc xử lý authentication failure đúng UX.

---

# 5. LEARNING SYSTEM TEST

Test:

## Vocabulary

- vocabulary retrieval
- learning
- completion
- review

## Spaced Repetition

- correct answer
- wrong answer
- next review date
- mastery update

## Progress

- session completion
- progress update
- statistics

## Recommendation

- available content
- completed content
- next recommended content

---

# 6. CONTENT MANAGEMENT TEST

Admin phải có thể:

Create
→ Draft
→ Edit
→ Preview
→ Publish
→ Student can access
→ Archive
→ Student behavior remains consistent

Không hard-delete content đã được sử dụng nếu điều đó phá vỡ learning history.

---

# 7. UI/UX QA

So sánh implementation với OpenDesign.

Kiểm tra:

- spacing
- typography
- colors
- components
- navigation
- forms
- responsive
- loading
- empty
- error
- success
- accessibility

Không tự redesign.

Nếu khác design:

Ghi:

`UI DEVIATION`

---

# 8. RESPONSIVE QA

Test:

- Desktop
- Tablet
- Mobile

Kiểm tra:

- navigation
- forms
- tables
- learning cards
- media
- content
- admin dashboard

---

# 9. PERFORMANCE

Kiểm tra:

- API response time
- unnecessary API calls
- frontend bundle
- image loading
- pagination
- database queries
- MongoDB indexes

Không tối ưu bằng cách tăng complexity nếu chưa cần.

---

# 10. SECURITY

Kiểm tra:

- authentication
- authorization
- password handling
- input validation
- injection risks
- exposed secrets
- CORS
- sensitive error messages
- admin access

Không commit:

- API keys
- database credentials
- JWT secrets
- environment secrets

---

# 11. BUG TRIAGE

Mỗi bug phải có:

- Bug ID
- Severity
- Area
- Reproduction steps
- Expected
- Actual
- Root cause
- Fix
- Regression test

Severity:

- Critical
- High
- Medium
- Low

---

# 12. RELEASE CHECKLIST

Trước release:

- Build passes
- Lint passes
- Tests pass
- Environment variables configured
- Database configured
- API configured
- Frontend configured
- Authentication tested
- Admin tested
- Student tested
- Responsive tested
- External media tested
- No secrets committed
- No debug code
- No unnecessary MongoDB data

---

# 13. DEFINITION OF DONE

Project chỉ được xem là MVP complete khi:

- All P0 features work.
- Student core learning flow works.
- Admin can manage required content.
- Frontend matches OpenDesign sufficiently.
- Backend follows API contract.
- Database follows schema.
- Authentication works.
- Authorization works.
- Core learning/progress/review works.
- External media works.
- Critical and High bugs are resolved.
- Production build succeeds.

---

# FINAL OUTPUT

Generate:

1. QA report
2. Integration report
3. Bug list
4. Security checklist
5. Performance findings
6. UI/UX deviations
7. Release checklist
8. MVP readiness assessment

Cuối cùng đưa ra:

`READY FOR MVP RELEASE`

hoặc:

`NOT READY`

kèm lý do.
