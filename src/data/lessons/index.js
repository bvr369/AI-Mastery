// Registry of authored lesson content, keyed by lesson id.
// Add a file per lesson and register it here — the roadmap flags it live via curriculum.js `live: true`.
import m1l1 from './m1-l1'
import m1l2 from './m1-l2'
import m1l3 from './m1-l3'
import m1l4 from './m1-l4'
import m1l5 from './m1-l5'
import m1l6 from './m1-l6'
import m1l7 from './m1-l7'
import m1l8 from './m1-l8'
import m2l1 from './m2-l1'
import m2l2 from './m2-l2'
import m2l3 from './m2-l3'
import m2l4 from './m2-l4'
import m2l5 from './m2-l5'
import m2l6 from './m2-l6'
import m2l7 from './m2-l7'
import m2l8 from './m2-l8'
import m2l9 from './m2-l9'
import m3l1 from './m3-l1'
import m3l2 from './m3-l2'
import m3l3 from './m3-l3'
import m3l4 from './m3-l4'
import m3l5 from './m3-l5'
import m3l6 from './m3-l6'
import m3l7 from './m3-l7'
import m3l8 from './m3-l8'

export const LESSON_CONTENT = {
  'm1-l1': m1l1,
  'm1-l2': m1l2,
  'm1-l3': m1l3,
  'm1-l4': m1l4,
  'm1-l5': m1l5,
  'm1-l6': m1l6,
  'm1-l7': m1l7,
  'm1-l8': m1l8,
  'm2-l1': m2l1,
  'm2-l2': m2l2,
  'm2-l3': m2l3,
  'm2-l4': m2l4,
  'm2-l5': m2l5,
  'm2-l6': m2l6,
  'm2-l7': m2l7,
  'm2-l8': m2l8,
  'm2-l9': m2l9,
  'm3-l1': m3l1,
  'm3-l2': m3l2,
  'm3-l3': m3l3,
  'm3-l4': m3l4,
  'm3-l5': m3l5,
  'm3-l6': m3l6,
  'm3-l7': m3l7,
  'm3-l8': m3l8,
}

/**
 * Flat index of every flashcard across all lessons: cardId -> { front, back, lessonId }.
 * The Review page uses this to resolve due-card ids (stored in progress) back to content.
 */
export const CARD_INDEX = Object.fromEntries(
  Object.entries(LESSON_CONTENT).flatMap(([lessonId, content]) =>
    content.sections.flatMap((section) =>
      section.blocks
        .filter((b) => b.type === 'flashcards')
        .flatMap((b) => b.cards.map((c) => [c.id, { front: c.front, back: c.back, lessonId }]))
    )
  )
)
