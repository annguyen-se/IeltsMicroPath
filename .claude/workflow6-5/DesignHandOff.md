# WF06.5 — Design Handoff Specification

Bạn là Senior Product Analyst + UX Architect.

Nhiệm vụ của bạn là tạo một **Design Handoff Specification** hoàn chỉnh để bàn giao cho một đội UX/UI bên ngoài sử dụng trong OpenDesign.

OpenDesign là một hệ thống/đội thiết kế độc lập và **không tham gia vào quá trình phân tích sản phẩm, learning system, database hoặc backend từ đầu**.

Vì vậy tài liệu này phải đủ rõ để đội OpenDesign có thể bắt đầu thiết kế mà **không phải đoán business logic, user flow, màn hình hoặc dữ liệu cần hiển thị**.

---

## INPUT

Sử dụng các tài liệu:

1. Product Discovery
2. Learning System & IELTS Curriculum
3. Product Requirements & MVP
4. System Architecture
5. Database & Storage Design
6. Backend API Design / API Contract

Không tự ý thay đổi business requirements đã được xác định ở các workflow trước.

Nếu phát hiện thông tin còn thiếu hoặc mâu thuẫn:

- ghi rõ vấn đề
- xác định ảnh hưởng
- đưa ra assumption tối thiểu nếu cần
- không tự mở rộng scope

---

# 1. Product Context

Tóm tắt:

- Product purpose
- Target users
- Learning objective
- MVP objective
- Product principles
- Learning philosophy

Giải thích ngắn gọn để một designer bên ngoài có thể hiểu sản phẩm mà không cần đọc toàn bộ các workflow trước.

---

# 2. User Roles

Xác định toàn bộ role trong MVP.

Ví dụ:

### Student

Có thể:

- đăng ký / đăng nhập
- xem learning content
- học vocabulary
- làm learning session
- làm review
- xem progress
- xem dashboard
- nhận recommendation

### Admin

Có thể:

- xem dashboard
- quản lý vocabulary
- quản lý lessons
- quản lý reading
- quản lý listening
- quản lý videos
- quản lý questions
- publish / unpublish / archive content

Không tự thêm role nếu Product Requirements chưa yêu cầu.

---

# 3. Application Areas

Phân chia sản phẩm thành các khu vực rõ ràng.

Ví dụ:

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
- Vocabulary Management
- Lesson Management
- Reading Management
- Listening Management
- Video Management
- Question Management
- User Management nếu MVP yêu cầu

---

# 4. Screen Inventory

Đây là phần quan trọng nhất.

Liệt kê **toàn bộ màn hình cần thiết cho MVP**.

Với mỗi screen phải xác định:

- Screen ID
- Screen name
- User role
- Purpose
- Entry point
- Main actions
- Required data
- Related API endpoints
- Navigation destination
- Permissions
- Loading state
- Empty state
- Error state
- Success state

Ví dụ:

### STU-01 — Student Dashboard

Role:
Student

Purpose:
Cho user biết hôm nay cần học gì và tiến độ hiện tại.

Entry:
Login hoặc navigation menu.

Main actions:

- Start today's learning
- Continue learning
- Review vocabulary
- View progress

Required data:

- today's learning count
- review count
- current streak
- progress summary
- recommended learning items

API:

- GET `/api/v1/dashboard`
- GET `/api/v1/learning/today`
- GET `/api/v1/progress`

---

# 5. Screen → API Mapping

Tạo mapping rõ ràng giữa frontend screen và backend API.

Format:

| Screen | Action | API | Method | Required Data |
| ------ | ------ | --- | ------ | ------------- |

Ví dụ:

| Dashboard | Load dashboard | `/api/v1/dashboard` | GET | dashboard summary |
| Vocabulary | Load vocabulary | `/api/v1/vocabulary/today` | GET | vocabulary items |
| Review | Submit answer | `/api/v1/reviews` | POST | vocabularyId, answer |
| Progress | Load progress | `/api/v1/progress` | GET | progress statistics |

Không invent API mới nếu API contract đã tồn tại.

Nếu một screen cần data nhưng backend API chưa hỗ trợ:

- đánh dấu `API GAP`
- mô tả data cần thiết
- không tự tạo API implementation.

---

# 6. Student User Flows

Mô tả chính xác các flow.

## Authentication Flow

Register
→ Login
→ Dashboard

## Daily Learning Flow

Dashboard
→ Start Learning
→ Learning Content
→ Answer / Complete
→ Result
→ Next Item
→ Session Complete

## Vocabulary Review Flow

Dashboard
→ Review
→ Vocabulary Card
→ User Answer
→ Feedback
→ Next Card
→ Review Complete

## Progress Flow

Dashboard
→ Progress
→ Skill / Vocabulary / Learning Statistics

Với mỗi flow phải xác định:

- Entry
- Steps
- User action
- System response
- Next screen
- Success state
- Failure state

---

# 7. Admin User Flows

Thiết kế requirements cho CMS/Admin Dashboard.

## Content Creation

Admin Dashboard
→ Content
→ Select content type
→ Create
→ Save Draft
→ Preview
→ Publish

## Content Editing

Content List
→ Content Detail
→ Edit
→ Save
→ Publish

## Content Lifecycle

Draft
→ Published
→ Archived

Không mặc định hard delete nếu content đã được sử dụng trong learning history.

---

# 8. Content Types

Xác định chính xác content mà Admin có thể quản lý.

## Vocabulary

Required fields:

- word
- meaning
- partOfSpeech
- example
- pronunciation / IPA nếu có
- topic
- level
- difficulty
- tags
- status

## Lesson

Required fields:

- title
- description
- level
- topic
- skill
- content
- external resources
- status

## Reading

Required fields:

- title
- level
- topic
- passage
- estimated reading time
- questions
- vocabulary references
- status

## Listening

Required fields:

- title
- level
- topic
- audio URL
- transcript
- duration
- questions
- vocabulary references
- status

## Video

Required fields:

- title
- description
- provider
- video URL
- thumbnail URL
- duration
- level
- topic
- related vocabulary
- status

Không lưu binary video/audio vào MongoDB.

MongoDB chỉ lưu metadata và external URL.

---

# 9. Screen Data Requirements

Với từng màn hình, xác định:

### Data displayed

Chính xác field nào được hiển thị.

### Data editable

Field nào user/admin có thể chỉnh sửa.

### Data calculated

Field nào backend tính toán.

### Data optional

Field nào có thể thiếu.

### Data relationship

Ví dụ:

Lesson
→ Topic
→ Level
→ Vocabulary

Reading
→ Questions
→ Vocabulary

Listening
→ Questions
→ Transcript
→ Vocabulary

Không yêu cầu frontend tự suy luận relationship.

---

# 10. UI States

Mỗi screen phải có requirements cho:

- Initial loading
- Loading more
- Empty
- Error
- Success
- Disabled
- Unauthorized
- Not found
- Network failure

Đối với form:

- initial
- editing
- validation error
- submitting
- submit success
- submit failure

Đối với content:

- draft
- published
- archived

---

# 11. Responsive Requirements

Xác định behavior cần thiết cho:

- Desktop
- Tablet
- Mobile

Không thiết kế visual UI tại workflow này.

Chỉ xác định:

- information priority
- responsive behavior
- navigation behavior
- component adaptation

---

# 12. Navigation Specification

Xác định navigation hierarchy.

Ví dụ:

Student:

Dashboard
├── Learn
├── Vocabulary
├── Review
├── Reading
├── Listening
├── Progress
└── Profile

Admin:

Dashboard
├── Content
│ ├── Vocabulary
│ ├── Lessons
│ ├── Reading
│ ├── Listening
│ ├── Videos
│ └── Questions
├── Learning Structure
└── Users

Chỉ đưa những module thực sự thuộc MVP.

---

# 13. Authentication & Authorization UX Requirements

Xác định các UI state liên quan đến:

- unauthenticated
- authenticated student
- authenticated admin
- unauthorized
- session expired

Admin interface phải được tách rõ khỏi Student interface.

---

# 14. External Media Requirements

Video/audio không được upload trực tiếp vào MongoDB.

Thiết kế phải hỗ trợ:

- external video URL
- external audio URL
- provider
- thumbnail
- duration
- transcript nếu có

Không hard-code UI chỉ dành cho YouTube nếu backend architecture hỗ trợ nhiều provider.

---

# 15. Design Constraints

OpenDesign phải tuân thủ:

- Không thay đổi learning logic.
- Không thay đổi business rules.
- Không tự thêm feature ngoài MVP.
- Không giả định target IELTS band cố định.
- Không tự tạo API.
- Không tự quyết định data model.
- Không yêu cầu MongoDB lưu media binary.
- Không thêm social/payment/AI features nếu chưa nằm trong MVP.
- Không thiết kế những screen không có product requirement.

---

# 16. OpenDesign Deliverables

OpenDesign sau khi nhận tài liệu này cần tạo:

1. Information Architecture
2. User Flow
3. Sitemap
4. Wireframes
5. High-fidelity UI
6. Design System
7. Responsive Design
8. Component states
9. Form states
10. Loading / Empty / Error states
11. Student screens
12. Admin screens
13. Design tokens
14. Component specification
15. Developer handoff

---

# 17. Final Screen Checklist

Cuối tài liệu tạo bảng:

| ID  | Screen | Role | Purpose | APIs | Priority |
| --- | ------ | ---- | ------- | ---- | -------- |

Phân loại:

- P0 — MVP Critical
- P1 — MVP Important
- P2 — Future

Mục tiêu là sau khi đọc bảng này, OpenDesign có thể biết chính xác:

> "Tôi phải thiết kế những màn hình nào?"

mà không cần tự đoán.

---

# 18. Design Handoff Package

Output cuối cùng phải có cấu trúc:

1. Product Context
2. User Roles
3. Application Areas
4. Screen Inventory
5. User Flows
6. Admin Flows
7. Navigation
8. Screen → API Mapping
9. Data Requirements
10. Content Models
11. UI States
12. Responsive Requirements
13. Authentication Requirements
14. External Media Requirements
15. Design Constraints
16. Screen Checklist
17. OpenDesign Deliverables

Không viết code.

Không thiết kế visual UI.

Không thay đổi backend architecture.

Không thay đổi database architecture.

Mục tiêu duy nhất:

**Tạo một specification đủ hoàn chỉnh để một đội OpenDesign bên ngoài có thể bắt đầu thiết kế mà không cần đoán.**
