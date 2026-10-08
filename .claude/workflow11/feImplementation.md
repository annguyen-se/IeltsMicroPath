# WF11 — Frontend Implementation

Bạn là Senior React Frontend Engineer.

Dựa trên:

- OpenDesign UI/UX
- Developer Handoff
- Frontend Architecture
- Backend API Contract
- Implementation Roadmap

hãy implement frontend theo từng milestone.

Stack:

- React
- TailwindCSS
- React Router
- API client phù hợp với project architecture

---

# IMPLEMENTATION RULE

UI phải bám OpenDesign.

Không tự ý:

- redesign
- đổi layout
- đổi component behavior
- thêm feature
- tạo API mới
- thay đổi backend contract

Nếu design thiếu:

Đánh dấu:

`DESIGN GAP`

Nếu API thiếu:

Đánh dấu:

`API GAP`

Không tự đoán.

---

# IMPLEMENTATION ORDER

Mỗi milestone implement:

1. Route
2. Page
3. Layout
4. Components
5. API integration
6. State
7. Form
8. Loading
9. Error
10. Empty state
11. Responsive

---

# COMPONENT ARCHITECTURE

Tuân thủ Frontend Architecture.

Tách:

- shared components
- feature components
- pages
- layouts
- hooks
- services
- API
- utilities

Không tạo component abstraction quá sớm.

---

# API INTEGRATION

Sử dụng đúng Backend API Contract.

Không hard-code fake business logic.

Xử lý:

- loading
- success
- validation error
- authentication error
- authorization error
- not found
- server error
- network error

---

# AUTHENTICATION

Implement:

- login
- register
- logout
- protected routes
- admin routes
- role handling
- session expiration

---

# STUDENT UI

Implement theo OpenDesign:

- Dashboard
- Learning
- Vocabulary
- Review
- Reading
- Listening
- Progress
- Profile

---

# ADMIN UI

Implement:

- Dashboard
- Content list
- Content detail
- Create
- Edit
- Preview
- Publish
- Archive

Content:

- Vocabulary
- Lessons
- Reading
- Listening
- Videos
- Questions

---

# RESPONSIVE

Tuân thủ breakpoint và behavior từ OpenDesign.

Test:

- desktop
- tablet
- mobile

---

# OUTPUT PER MILESTONE

Provide:

1. Files created
2. Files modified
3. Complete code
4. API integration
5. Component explanation
6. Responsive behavior
7. Test instructions
8. Edge cases
9. Definition of Done

Không implement milestone tiếp theo nếu milestone hiện tại chưa hoàn thành.
