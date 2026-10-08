# WF09 — Implementation Roadmap

Bạn là Senior Technical Lead.

Dựa trên:

- Product Requirements
- Learning System
- System Architecture
- Database Design
- Backend API Contract
- Design Handoff
- OpenDesign UI/UX
- Frontend Architecture

hãy tạo implementation roadmap cho MVP.

---

# OBJECTIVE

Chia toàn bộ MVP thành các milestone nhỏ.

Mỗi milestone phải tạo ra một phần product có thể chạy và kiểm thử.

Không chia project chỉ theo:

- frontend
- backend
- database

Ưu tiên chia theo functional vertical slice.

---

# MILESTONE FORMAT

Mỗi milestone phải có:

## Objective

Mục tiêu.

## Features

Tính năng.

## Database

Collections/fields liên quan.

## Backend

APIs/services cần implement.

## Frontend

Pages/components cần implement.

## Integration

Frontend ↔ Backend.

## Testing

Test cases.

## Dependencies

Phụ thuộc milestone nào.

## Definition of Done

Điều kiện hoàn thành.

---

# RECOMMENDED ORDER

Thiết kế roadmap có thể bao gồm:

### M01 — Project Foundation

- Repository
- Environment
- React
- Express
- MongoDB
- Basic architecture

### M02 — Authentication

- Register
- Login
- Logout
- Authentication
- Roles

### M03 — Content Foundation

- Vocabulary
- Lessons
- Reading
- Listening
- Videos
- Questions

### M04 — Admin Content Management

- Admin dashboard
- Content list
- Create
- Edit
- Publish
- Archive

### M05 — Student Dashboard

- Dashboard
- Learning overview
- Daily learning

### M06 — Vocabulary Learning

- Vocabulary retrieval
- Learning session
- Vocabulary UI

### M07 — Review System

- Review submission
- Spaced repetition
- Due reviews

### M08 — Progress

- Learning statistics
- Vocabulary progress
- Skill progress

### M09 — Reading / Listening

- Reading experience
- Listening experience
- Questions
- Results

### M10 — Recommendation

- Basic recommendation
- Next learning content

### M11 — Integration

- Full frontend/backend integration
- Error handling
- Responsive

### M12 — QA / Release

- Testing
- Bug fixing
- Performance
- Deployment

Adjust this order based on actual dependencies.

---

# RULES

Do not add features outside MVP.

Do not introduce microservices.

Do not redesign architecture.

Do not change database design.

Do not change API contract.

If a dependency is missing, identify it explicitly.

---

# FINAL OUTPUT

Provide:

1. Complete milestone roadmap
2. Dependency graph
3. Critical path
4. Recommended implementation order
5. Definition of Done per milestone
6. Testing strategy
7. Release strategy
