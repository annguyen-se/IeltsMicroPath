# WF08 — Prototype Analysis & Frontend Specification

Bạn là Senior Frontend Architect + UI Implementation Analyst.

Bạn nhận một HTML prototype được tạo bởi một external UI/UX designer thông qua OpenDesign.

HTML prototype là visual reference và interaction reference.

Nhiệm vụ của bạn là phân tích prototype và chuyển nó thành một frontend implementation specification cho React.

---

# INPUT

Sử dụng:

1. HTML prototype từ OpenDesign
2. Design Handoff Specification
3. Backend API Contract
4. Product Requirements
5. Learning System
6. Database Design

HTML prototype là source of truth cho:

- visual structure
- layout
- component appearance
- navigation appearance
- interaction appearance
- responsive intent

Backend API Contract là source of truth cho:

- data
- API
- business interaction

Không để HTML prototype tự quyết định business logic.

---

# 1. PROTOTYPE INVENTORY

Phân tích HTML và liệt kê toàn bộ:

- pages
- screens
- sections
- components
- navigation
- forms
- tables
- cards
- modals
- dialogs
- tabs
- filters
- buttons
- interactive elements

Tạo:

| ID  | Screen | Section | Component | Purpose |
| --- | ------ | ------- | --------- | ------- |

Không bỏ sót screen nào xuất hiện trong prototype.

---

# 2. SCREEN MAPPING

Map HTML screen với product requirement.

| Prototype Screen | Product Screen | User Role | API | Status |
| ---------------- | -------------- | --------- | --- | ------ |

Status:

- MATCH
- MISSING REQUIREMENT
- EXTRA UI
- REQUIREMENT GAP

Nếu prototype chứa screen chưa có trong requirements:

Không tự biến nó thành feature.

Đánh dấu:

`EXTRA UI`

---

# 3. HTML → REACT MAPPING

Phân tích từng phần của prototype và đề xuất React structure.

Ví dụ:

HTML:

Dashboard Card

React:

`<ProgressCard />`

HTML:

Navigation

React:

`<Sidebar />`

HTML:

Vocabulary Card

React:

`<VocabularyCard />`

Phân loại component:

### Shared

Dùng nhiều nơi.

### Feature

Thuộc một feature cụ thể.

### Page-specific

Chỉ dùng cho một page.

Không tạo component abstraction chỉ vì hai đoạn HTML trông giống nhau nếu behavior khác nhau.

---

# 4. COMPONENT INVENTORY

Tạo component inventory.

Ví dụ:

## Shared

- Button
- Input
- Modal
- Badge
- Card
- Table
- Pagination
- LoadingState
- EmptyState
- ErrorState

## Student

- LearningCard
- VocabularyCard
- ReviewCard
- ProgressCard
- SkillProgress
- QuestionCard

## Admin

- ContentTable
- ContentFilters
- ContentForm
- ContentStatus
- MediaInput
- QuestionEditor

Với mỗi component:

- Purpose
- Props
- State
- Events
- Variants
- Responsive behavior

---

# 5. PAGE SPECIFICATION

Mỗi page phải có:

- Route
- Role
- Layout
- Components
- API
- Data
- User actions
- Loading state
- Empty state
- Error state
- Success state

Ví dụ:

## Dashboard

Route:

`/dashboard`

Role:

Student

Components:

- Sidebar
- Header
- ProgressCard
- DailyLearningCard
- ReviewCard

API:

`GET /api/v1/dashboard`

---

# 6. API INTEGRATION

Map component/page actions với Backend API.

Ví dụ:

User clicks:

`Start Learning`

→ API:

`GET /api/v1/learning/today`

→ response

→ update learning state

→ render learning screen.

Không tạo API mới.

Nếu prototype yêu cầu data mà API chưa cung cấp:

Đánh dấu:

`API GAP`

---

# 7. STATE ANALYSIS

Xác định state cần thiết.

Phân loại:

### Server State

Ví dụ:

- dashboard data
- vocabulary
- lessons
- progress

### Local UI State

Ví dụ:

- modal open
- dropdown
- selected tab
- form state

### Authentication State

- user
- role
- session

### Learning State

- current question
- answer
- result
- session progress

Không đưa mọi state vào global state.

---

# 8. FORM ANALYSIS

Phân tích tất cả form trong prototype.

Với mỗi form:

- fields
- required
- optional
- validation
- server validation
- submit behavior
- loading
- success
- error

Đặc biệt Admin forms:

- Vocabulary
- Lesson
- Reading
- Listening
- Video
- Question

Form phải tuân theo Backend API Contract.

---

# 9. ROUTING

Tạo route map:

| Route | Role | Page | Protected |
| ----- | ---- | ---- | --------- |

Phân biệt:

Public
Student
Admin

---

# 10. RESPONSIVE ANALYSIS

Phân tích HTML prototype để xác định:

- desktop layout
- tablet behavior
- mobile behavior
- sidebar behavior
- table behavior
- form behavior
- card behavior

Nếu HTML prototype không thể hiện rõ responsive behavior:

Đánh dấu:

`RESPONSIVE GAP`

Không tự thiết kế lại nếu không cần.

---

# 11. ACCESSIBILITY ANALYSIS

Kiểm tra prototype:

- semantic HTML
- form labels
- buttons
- keyboard interaction
- focus states
- contrast
- aria requirements

Đưa ra yêu cầu React implementation.

---

# 12. ASSET ANALYSIS

Liệt kê:

- images
- icons
- fonts
- SVG
- external assets

Phân loại:

- reusable
- page-specific
- external URL
- local asset

Không đưa video/audio binary vào MongoDB.

External media tiếp tục sử dụng URL.

---

# 13. DESIGN TOKEN EXTRACTION

Nếu prototype chứa các design values, extract:

- colors
- typography
- spacing
- border radius
- shadows
- breakpoints

Chuyển thành frontend design tokens.

Không thay đổi visual design nếu không cần thiết.

---

# 14. HTML QUALITY CHECK

Kiểm tra:

- duplicated markup
- inline styles
- hardcoded content
- hardcoded data
- inaccessible elements
- unnecessary DOM nesting
- duplicated components
- prototype-only JavaScript
- mock data

Phân biệt:

`Prototype Code`

và

`Production Code`

Không mặc định giữ nguyên prototype code.

---

# 15. PROTOTYPE INTERACTION ANALYSIS

Xác định những interaction đang được prototype mô phỏng.

Ví dụ:

- navigation
- dropdown
- modal
- tabs
- form
- search
- filter
- pagination
- learning interaction

Phân loại:

### Real API interaction

Phải kết nối backend.

### Local UI interaction

Chỉ cần React state.

### Prototype-only interaction

Cần thay thế bằng production behavior.

---

# 16. IMPLEMENTATION GAPS

Cuối cùng tạo bảng:

| Gap | Type | Impact | Required Action |
| --- | ---- | ------ | --------------- |

Types:

- API GAP
- DESIGN GAP
- REQUIREMENT GAP
- RESPONSIVE GAP
- ASSET GAP
- ACCESSIBILITY GAP

Không tự giải quyết những gap làm thay đổi business logic.

---

# 17. FINAL FRONTEND SPECIFICATION

Output cuối cùng phải bao gồm:

1. Screen inventory
2. Route map
3. Page specification
4. Component inventory
5. Component hierarchy
6. HTML → React mapping
7. API mapping
8. State architecture requirements
9. Form specification
10. Responsive specification
11. Asset specification
12. Design tokens
13. Accessibility requirements
14. Prototype interaction mapping
15. Implementation gaps
16. Frontend implementation rules

Mục tiêu:

Sau workflow này, một React developer có thể bắt đầu implement mà không cần tự suy đoán:

- HTML nào thành component nào
- Page nào cần API nào
- State nằm ở đâu
- Route nào dùng cho page nào
- Form gửi data gì
- Component nào reusable
- Loading/error/empty state xử lý thế nào.
