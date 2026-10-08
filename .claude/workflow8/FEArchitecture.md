# WF08 — Frontend Architecture

Bạn là Senior React Frontend Architect.

Dựa trên:

1. Product Requirements
2. Learning System
3. System Architecture
4. Backend API Contract
5. Design Handoff Specification
6. OpenDesign UI/UX
7. OpenDesign Developer Handoff

hãy thiết kế frontend architecture.

Stack:

- React
- TailwindCSS
- React Router
- JavaScript hoặc TypeScript theo project decision
- API communication với ExpressJS backend

---

# 1. APPLICATION STRUCTURE

Thiết kế frontend structure cho:

## Student App

- Authentication
- Dashboard
- Learning
- Vocabulary
- Review
- Reading
- Listening
- Progress
- Profile

## Admin App

- Admin Dashboard
- Content Management
- Vocabulary
- Lessons
- Reading
- Listening
- Videos
- Questions

---

# 2. ROUTING

Xác định:

- Public routes
- Student routes
- Admin routes

Ví dụ:

/login
/register

/dashboard
/learn
/vocabulary
/review
/reading
/listening
/progress
/profile

/admin
/admin/content
/admin/vocabulary
/admin/lessons
/admin/reading
/admin/listening
/admin/videos

Thiết kế route protection cho:

- authenticated user
- student
- admin

---

# 3. PROJECT STRUCTURE

Thiết kế folder structure cho React.

Phân tách hợp lý:

- pages
- layouts
- components
- features
- hooks
- services
- api
- routes
- utils
- constants
- context/state nếu cần

Không over-engineer.

---

# 4. COMPONENT ARCHITECTURE

Xác định:

### Shared components

Ví dụ:

- Button
- Input
- Modal
- Card
- Table
- Pagination
- Badge
- Alert
- Loading
- EmptyState
- ErrorState

### Learning components

Ví dụ:

- VocabularyCard
- QuestionCard
- LearningSession
- ProgressBar
- ReviewCard

### Admin components

Ví dụ:

- ContentTable
- ContentForm
- ContentStatus
- ContentFilters
- MediaField

Component phải được thiết kế dựa trên OpenDesign.

---

# 5. API INTEGRATION

Map frontend features với Backend API.

Mỗi feature xác định:

- API endpoint
- HTTP method
- request
- response
- loading
- error
- success

Không tự tạo API ngoài Backend Contract.

---

# 6. STATE MANAGEMENT

Xác định:

- authentication state
- user state
- learning session state
- review state
- progress state
- admin content state

Chỉ sử dụng global state khi cần.

Không đưa toàn bộ application state vào global store.

---

# 7. FORMS

Thiết kế architecture cho:

- Login
- Register
- Vocabulary form
- Lesson form
- Reading form
- Listening form
- Video form

Xử lý:

- validation
- loading
- server error
- success
- dirty state

---

# 8. AUTHENTICATION

Thiết kế:

- login
- logout
- session handling
- protected routes
- role-based routes
- unauthorized state
- expired session

---

# 9. RESPONSIVE

Frontend phải implement đúng responsive behavior từ OpenDesign:

- desktop
- tablet
- mobile

Không tự thay đổi layout nếu không cần thiết.

---

# 10. ERROR HANDLING

Chuẩn hóa:

- network error
- 400
- 401
- 403
- 404
- 409
- 422
- 500

Frontend phải hiển thị UX phù hợp với từng loại lỗi.

---

# 11. PERFORMANCE

Đề xuất:

- lazy loading
- route splitting
- image optimization
- pagination
- avoiding unnecessary requests
- caching nếu cần

Không premature optimization.

---

# 12. OUTPUT

Deliver:

1. Folder structure
2. Route architecture
3. Page architecture
4. Component architecture
5. Feature architecture
6. API integration architecture
7. State architecture
8. Authentication architecture
9. Form architecture
10. Error handling
11. Responsive strategy
12. Implementation guidelines

Không viết toàn bộ application code.
