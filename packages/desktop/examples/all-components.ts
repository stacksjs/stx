/**
 * All Components Showcase
 *
 * This example demonstrates all 35 native components available
 * in the desktop package.
 *
 * Components are organized into categories:
 * - Input Components (9)
 * - Display Components (9)
 * - Layout Components (7)
 * - Data Components (5)
 * - Advanced Components (5)
 *
 * Note: Most components are placeholders. Full implementations
 * will be available in future releases.
 *
 * To run this example:
 *   bun run examples/all-components.ts
 */

import {
  AVAILABLE_COMPONENTS,
  createButton,
  createCheckbox,
  createTextInput,
} from '../src/index'

async function main() {
  console.log('🎨 All Native Components Showcase\n')
  console.log(`Total Components Available: ${AVAILABLE_COMPONENTS.length}\n`)

  // ==========================================
  // INPUT COMPONENTS (9)
  // ==========================================
  console.log('📝 INPUT COMPONENTS (9)\n')

  // 1. Button
  console.log('1. Button Component')
  const button = createButton({
    text: 'Click Me!',
    variant: 'primary',
    size: 'medium',
    onClick: () => console.log('Button clicked!'),
  })
  console.log(`   ${button}\n`)

  // 2. TextInput
  console.log('2. TextInput Component')
  const textInput = createTextInput({
    placeholder: 'Enter your name...',
    type: 'text',
    onChange: value => console.log(`Input changed: ${value}`),
  })
  console.log(`   ${textInput}\n`)

  // 3. Checkbox
  console.log('3. Checkbox Component')
  const checkbox = createCheckbox({
    label: 'Accept terms and conditions',
    checked: false,
    onChange: checked => console.log(`Checkbox: ${checked}`),
  })
  console.log(`   ${checkbox}\n`)

  // Other input components (placeholders)
  console.log('4. RadioButton Component')
  console.log('   <input type="radio" /> (Coming soon)\n')

  console.log('5. Slider Component')
  console.log('   <input type="range" /> (Coming soon)\n')

  console.log('6. ColorPicker Component')
  console.log('   <input type="color" /> (Coming soon)\n')

  console.log('7. DatePicker Component')
  console.log('   <input type="date" /> (Coming soon)\n')

  console.log('8. TimePicker Component')
  console.log('   <input type="time" /> (Coming soon)\n')

  console.log('9. Autocomplete Component')
  console.log('   <input + suggestions dropdown> (Coming soon)\n')

  // ==========================================
  // DISPLAY COMPONENTS (9)
  // ==========================================
  console.log('\n📺 DISPLAY COMPONENTS (9)\n')

  console.log('1. Label Component')
  console.log('   Static text display (Coming soon)\n')

  console.log('2. ImageView Component')
  console.log('   Image display with loading states (Coming soon)\n')

  console.log('3. ProgressBar Component')
  console.log('   Visual progress indicator (Coming soon)\n')

  console.log('4. Avatar Component')
  console.log('   User profile picture display (Coming soon)\n')

  console.log('5. Badge Component')
  console.log('   Small status indicators (Coming soon)\n')

  console.log('6. Chip Component')
  console.log('   Compact information elements (Coming soon)\n')

  console.log('7. Card Component')
  console.log('   Container with elevation (Coming soon)\n')

  console.log('8. Tooltip Component')
  console.log('   Hover information display (Coming soon)\n')

  console.log('9. Toast Component')
  console.log('   Notification messages (Coming soon)\n')

  // ==========================================
  // LAYOUT COMPONENTS (7)
  // ==========================================
  console.log('\n📐 LAYOUT COMPONENTS (7)\n')

  console.log('1. ScrollView Component')
  console.log('   Scrollable container (Coming soon)\n')

  console.log('2. SplitView Component')
  console.log('   Resizable split panels (Coming soon)\n')

  console.log('3. Accordion Component')
  console.log('   Collapsible content sections (Coming soon)\n')

  console.log('4. Stepper Component')
  console.log('   Multi-step wizard (Coming soon)\n')

  console.log('5. Modal Component')
  console.log('   Overlay dialog (Coming soon)\n')

  console.log('6. Tabs Component')
  console.log('   Tabbed content navigation (Coming soon)\n')

  console.log('7. Dropdown Component')
  console.log('   Expandable menu (Coming soon)\n')

  // ==========================================
  // DATA COMPONENTS (5)
  // ==========================================
  console.log('\n📊 DATA COMPONENTS (5)\n')

  console.log('1. ListView Component')
  console.log('   Scrollable list of items (Coming soon)\n')

  console.log('2. Table Component')
  console.log('   Data table with sorting/filtering (Coming soon)\n')

  console.log('3. TreeView Component')
  console.log('   Hierarchical data display (Coming soon)\n')

  console.log('4. DataGrid Component')
  console.log('   Advanced table with editing (Coming soon)\n')

  console.log('5. Chart Component')
  console.log('   Data visualization (Coming soon)\n')

  // ==========================================
  // ADVANCED COMPONENTS (5)
  // ==========================================
  console.log('\n⚡ ADVANCED COMPONENTS (5)\n')

  console.log('1. Rating Component')
  console.log('   Star rating input (Coming soon)\n')

  console.log('2. CodeEditor Component')
  console.log('   Syntax-highlighted code editor (Coming soon)\n')

  console.log('3. MediaPlayer Component')
  console.log('   Audio/video player (Coming soon)\n')

  console.log('4. FileExplorer Component')
  console.log('   File system browser (Coming soon)\n')

  console.log('5. WebView Component')
  console.log('   Embedded web content (Coming soon)\n')

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n═══════════════════════════════════════')
  console.log('📋 COMPONENT SUMMARY')
  console.log('═══════════════════════════════════════')
  console.log(`Total Components: ${AVAILABLE_COMPONENTS.length}`)
  console.log(`Implemented: 3 (Button, TextInput, Checkbox)`)
  console.log(`Documented: ${AVAILABLE_COMPONENTS.length}`)
  console.log(`Coming Soon: ${AVAILABLE_COMPONENTS.length - 3}`)
  console.log('═══════════════════════════════════════\n')

  console.log('💡 All components follow a consistent API pattern:')
  console.log('   - Type-safe TypeScript interfaces')
  console.log('   - Common ComponentProps base')
  console.log('   - Event handlers for user interactions')
  console.log('   - Customizable styling and behavior\n')

  console.log('📚 For more details, see the component type definitions in:')
  console.log('   packages/desktop/src/types.ts')
  console.log('   packages/desktop/src/components.ts\n')
}

// Run the example
main().catch(console.error)
