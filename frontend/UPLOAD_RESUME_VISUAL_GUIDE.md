# Upload Resume - Visual Guide

## 🎨 Design System

### Color Palette
- **Primary Gradient**: Blue (#2563eb) → Purple (#7c3aed) → Violet (#8b5cf6)
- **Background**: Soft gradient from gray-50 → blue-50/30 → purple-50/30
- **Success**: Green (#22c55e) for 90%+ matches
- **Warning**: Blue (#3b82f6) for 75-89% matches
- **Caution**: Yellow (#eab308) for 60-74% matches
- **Neutral**: Gray for below 60%

### Typography
- **Headings**: Bold, gradient text (4xl-5xl)
- **Body**: Gray-900 for dark text, Gray-600 for secondary
- **Labels**: Small, semibold, Gray-500

### Spacing
- **Cards**: Rounded-2xl with consistent padding (p-6)
- **Gaps**: 6-8 units between sections
- **Grid**: 3-column layout (1 sidebar + 2 main content)

---

## 📱 User Interface Sections

### 1. Header Section
```
┌─────────────────────────────────────────────────────┐
│  [🧠] AI-Powered Job Matching                      │
│                                                     │
│     Upload Your Resume                             │
│     ═══════════════════                            │
│                                                     │
│  Let our AI analyze your resume and match you     │
│  with the perfect job opportunities in Karnataka   │
└─────────────────────────────────────────────────────┘
```
**Design Elements:**
- Badge with brain icon
- Large gradient heading (blue → purple → violet)
- Descriptive subtitle
- Slide-down animation on load

---

### 2. Left Sidebar - Upload Area

#### 2A. Empty State (No File)
```
┌─────────────────────────────────┐
│  ┌─────────────────────────┐   │
│  │         [📤]            │   │
│  │                         │   │
│  │  Drop your resume here  │   │
│  │  or click to browse     │   │
│  │                         │   │
│  │  PDF, DOC, DOCX • Max 5MB│  │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```
**Design Elements:**
- Dashed border (border-2 border-dashed)
- Upload icon in gradient circle
- Hover state: blue border + light blue background
- Drag active: solid blue border + blue-50 background

#### 2B. File Uploaded State
```
┌─────────────────────────────────┐
│  ┌─────────────────────────┐   │
│  │ [📄] Resume.pdf    [🗑️] │  │
│  │      2.5 MB             │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ⏳ Analyzing Resume...  │   │
│  │    AI is processing     │   │
│  └─────────────────────────┘   │
│                                 │
│  OR                             │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ✓ Analysis Complete!    │   │
│  │   Found 3 matching jobs │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```
**Design Elements:**
- File info card (blue-50 → purple-50 gradient)
- Loading spinner (rotating circle)
- Success checkmark (green-600)
- Trash icon for removal

---

### 3. Left Sidebar - AI Features Card
```
┌─────────────────────────────────┐
│  ✨ AI Features                 │
│  ───────────────────────        │
│                                 │
│  [🧠] Smart Parsing             │
│       Extract skills, exp...    │
│                                 │
│  [🎯] Match Scoring             │
│       Get percentage match...   │
│                                 │
│  [⚡] Instant Results            │
│       Get matches in seconds    │
└─────────────────────────────────┘
```
**Design Elements:**
- Icon badges (8x8, rounded-lg, colored backgrounds)
- Feature title + description
- Consistent spacing between items

---

### 4. Left Sidebar - Pro Tips Card
```
┌─────────────────────────────────┐
│  ⚠️ Pro Tips                    │
│  ───────────────────            │
│                                 │
│  • Use a clean, well-formatted  │
│    resume                       │
│  • Include relevant keywords    │
│  • Keep file size under 5MB     │
│  • Update regularly for better  │
│    matches                      │
└─────────────────────────────────┘
```
**Design Elements:**
- Amber gradient background (amber-50 → orange-50)
- Alert circle icon
- Bullet point list
- Warm color scheme for attention

---

### 5. Right Panel - Empty State
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              [📄]                                   │
│                                                     │
│     Upload Resume to Get Started                   │
│                                                     │
│  Once you upload your resume, our AI will         │
│  analyze it and show you personalized job         │
│  matches with detailed scoring                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```
**Design Elements:**
- Large icon (24x24 rounded circle)
- Centered text
- White/60 background with blur
- Scale-in animation

---

### 6. Right Panel - Analyzing State
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│            [🧠] (pulsing)                          │
│                                                     │
│       Analyzing Your Resume...                     │
│                                                     │
│  Our AI is extracting skills, experience, and     │
│  matching with thousands of jobs                   │
│                                                     │
│  [████████████████░░░░░░] 80%                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```
**Design Elements:**
- Pulsing brain icon (animate-pulse)
- Progress bar with moving gradient
- Blue → purple gradient animation
- Centered layout

---

### 7. Right Panel - Resume Summary Card
```
┌─────────────────────────────────────────────────────┐
│  📄 Resume Summary                                  │
│  ───────────────────────────────────────────────   │
│                                                     │
│  Name              Experience                      │
│  John Doe          5 years                         │
│                                                     │
│  Location          Education                       │
│  Bangalore         B.Tech in CS                    │
│                                                     │
│  Key Skills                                        │
│  [JavaScript] [React] [Node.js] [Python] [SQL]    │
│  [AWS]                                             │
└─────────────────────────────────────────────────────┘
```
**Design Elements:**
- 2-column grid layout
- Label (gray-500) + Value (gray-900) pairs
- Skill pills (gradient blue-100 → purple-100)
- Rounded-full badges

---

### 8. Right Panel - Matched Jobs Card
```
┌─────────────────────────────────────────────────────┐
│  🎯 Matched Jobs (3)         [↓ Download Report]   │
│  ───────────────────────────────────────────────   │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │ Senior Full Stack Developer        [95%]  │    │
│  │ Tech Solutions Pvt Ltd                    │    │
│  │ 📍 Bangalore • ⏰ 2 days ago • ₹15-20 LPA │    │
│  │                                           │    │
│  │ 📈 Why you're a great fit:               │    │
│  │ ✓ 5 years experience matches requirement │    │
│  │ ✓ All required skills match               │    │
│  │ ✓ Location preference matches             │    │
│  │                                           │    │
│  │ [Apply Now]      [View Details]           │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  [More jobs...]                                    │
└─────────────────────────────────────────────────────┘
```
**Design Elements:**
- Job title (hover: blue-600)
- Match score badge (color-coded by score)
  - 90%+: Green background
  - 75-89%: Blue background
  - 60-74%: Yellow background
- Match reasons (checkmark + reason)
- Gradient action buttons
- Hover effects (shadow-xl, border-blue-300)

---

### 9. Match Score Badge Variations

#### Excellent Match (90%+)
```
┌─────────┐
│   95%   │ ← Green gradient text
│  Match  │ ← Small gray text
└─────────┘
Background: bg-green-50 border-green-200
```

#### Good Match (75-89%)
```
┌─────────┐
│   88%   │ ← Blue gradient text
│  Match  │
└─────────┘
Background: bg-blue-50 border-blue-200
```

#### Fair Match (60-74%)
```
┌─────────┐
│   72%   │ ← Yellow gradient text
│  Match  │
└─────────┘
Background: bg-yellow-50 border-yellow-200
```

---

### 10. Bottom CTA Section
```
┌─────────────────────────────────────────────────────┐
│                      ✨                             │
│                                                     │
│       Want Even Better Matches?                    │
│                                                     │
│  Create a complete profile to get personalized     │
│  job recommendations and let employers find you    │
│                                                     │
│         [Complete Your Profile]                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```
**Design Elements:**
- Full-width gradient background (blue → purple → violet)
- White text
- Large sparkles icon
- White button with blue-600 text
- Shadow-2xl

---

## 🎭 Animations & Interactions

### Page Load Sequence
1. **Header** (0ms): Slide down from top
2. **Badge** (0ms): Scale in
3. **Upload Card** (0ms): Scale in
4. **Features Card** (100ms delay): Scale in
5. **Tips Card** (200ms delay): Scale in
6. **Empty State** (100ms delay): Scale in

### File Upload Flow
1. User drops/selects file
2. File card appears (slide up)
3. Analyzing state shows (fade in)
4. Progress bar animates (left to right)
5. Success state (fade in with checkmark)
6. Results cards animate in (staggered)

### Hover Effects
- **Cards**: shadow-lg → shadow-xl
- **Buttons**: Slight scale (hover:scale-105)
- **Job titles**: color shift to blue-600
- **Borders**: gray-200 → blue-300

### Micro-interactions
- **Upload area**: Border pulse on drag-over
- **Match score**: Gradient shimmer effect
- **Icons**: Subtle bounce on hover
- **Checkmarks**: Pop-in animation

---

## 📐 Responsive Breakpoints

### Desktop (lg: 1024px+)
- 3-column grid (1 sidebar + 2 content)
- Full navigation visible
- Side-by-side layout

### Tablet (md: 768px)
- 2-column grid
- Sidebar stacks with content
- Compact navigation

### Mobile (< 768px)
- Single column
- Full-width cards
- Stacked layout
- Mobile-optimized upload area

---

## 🎨 Component States

### Upload Dropzone
1. **Default**: Dashed border, gray-300
2. **Hover**: Dashed border, blue-400, bg-gray-50
3. **Drag Active**: Solid border, blue-500, bg-blue-50
4. **Disabled**: Opacity-50, cursor-not-allowed

### Buttons
1. **Primary**: Gradient bg, white text
2. **Primary Hover**: Darker gradient, shadow-lg
3. **Secondary**: Border-2, gray-300
4. **Secondary Hover**: border-blue-500, text-blue-600

### Status Indicators
1. **Loading**: Spinning circle, blue-600
2. **Success**: Checkmark, green-600
3. **Error**: X-circle, red-600
4. **Info**: Alert circle, amber-600

---

## 💡 Accessibility Features

### Keyboard Navigation
- Tab through upload area
- Enter to open file dialog
- Escape to close modals
- Arrow keys for job list

### Screen Reader Support
- ARIA labels on upload area
- Alt text for icons
- Semantic HTML structure
- Status announcements

### Color Contrast
- WCAG AA compliant
- Minimum 4.5:1 for text
- Focus indicators visible
- No color-only information

---

## 🚀 Performance Features

### Optimizations
- Lazy loading of heavy components
- Debounced file upload
- Memoized calculations
- CSS animations (GPU accelerated)

### Loading Strategies
- Skeleton screens
- Progressive enhancement
- Optimistic UI updates
- Error boundaries

---

## 📊 Data Visualization

### Match Score Representation
```
90-100%: ████████████ (Green)
75-89%:  █████████░░░ (Blue)
60-74%:  ██████░░░░░░ (Yellow)
0-59%:   ███░░░░░░░░░ (Gray)
```

### Skills Distribution
- Horizontal pill layout
- Color-coded by category
- Wrap to multiple lines
- Gradient backgrounds

---

## 🎯 Call-to-Action Hierarchy

### Primary Actions
1. **Upload Resume** - Most prominent, gradient button
2. **Apply Now** - Per-job action, gradient
3. **Complete Profile** - Bottom CTA, white button

### Secondary Actions
1. **View Details** - Bordered button
2. **Download Report** - Text link with icon
3. **Remove File** - Icon button

### Tertiary Actions
1. **Pro Tips** - Informational card
2. **Feature highlights** - Side panel info

---

## 📝 Content Guidelines

### Messaging Tone
- **Encouraging**: "Want Even Better Matches?"
- **Helpful**: "Pro Tips" section
- **Clear**: Step-by-step instructions
- **Professional**: Job descriptions

### Microcopy
- "Drop your resume here" (friendly)
- "AI is processing your document" (transparent)
- "Analysis Complete!" (celebratory)
- "Why you're a great fit:" (personal)

---

## 🔍 Edge Cases Handled

### File Upload
- ✅ File too large (>5MB)
- ✅ Invalid file type
- ✅ Network error
- ✅ Parsing failure
- ✅ No matches found

### Display States
- ✅ No resume uploaded
- ✅ Uploading in progress
- ✅ Analysis in progress
- ✅ Results loaded
- ✅ Empty results

---

This visual guide provides a complete reference for the Upload Resume feature's design, interactions, and user experience.
