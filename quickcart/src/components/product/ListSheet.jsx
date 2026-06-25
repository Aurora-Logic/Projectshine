import { useState } from 'react'
import { Heading, Text, Flex, Button } from '@radix-ui/themes'
import { CheckIcon, BookmarkIcon, PlusIcon } from '@radix-ui/react-icons'
import { loadLists, saveLists } from '../../lib/lists.js'

/* Save-to-list sheet, opened from the product page bookmark */
export function ListSheet({ p, onClose }) {
  const [lists, setLists] = useState(loadLists)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [savedTo, setSavedTo] = useState(null)
  const commit = (next, label) => {
    setLists(next)
    saveLists(next)
    setSavedTo(label)
    setTimeout(onClose, 850)
  }
  const pick = (l) => {
    commit(lists.map(x => x.id !== l.id ? x : {
      ...x,
      items: x.items.some(i => i.id === p.id)
        ? x.items.map(i => (i.id === p.id ? { ...i, n: i.n + 1 } : i))
        : [...x.items, { id: p.id, n: 1 }],
    }), l.name)
  }
  const create = () => {
    commit([...lists, { id: `l${Date.now()}`, name: name.trim(), items: [{ id: p.id, n: 1 }] }], name.trim())
  }
  return (
    <div className="qsheet-overlay" onClick={onClose}>
      <div className="qsheet" onClick={(e) => e.stopPropagation()}>
        <div className="qsheet-grab" />
        <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>Save to project list</Heading>
        <Text size="1" color="gray" as="div" mt="1" className="clamp1">{p.name}</Text>
        {savedTo ? (
          <div className="calc-out" style={{ marginTop: 14 }}>
            <Flex align="center" gap="2">
              <CheckIcon width={14} height={14} color="var(--green-11)" />
              <Text size="2" weight="bold" style={{ color: 'var(--green-11)' }}>Saved to {savedTo}</Text>
            </Flex>
          </div>
        ) : (
          <>
            <div className="addr-list">
              {lists.map(l => (
                <button key={l.id} className="addr-row" onClick={() => pick(l)}>
                  <span className="mrow-ic" style={{ background: 'var(--plum-3)', color: 'var(--plum-11)', width: 30, height: 30 }}>
                    <BookmarkIcon width={14} height={14} />
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <Text size="2" weight="bold" as="div">{l.name}</Text>
                    <Text size="1" color="gray" as="div">{l.items.length} items</Text>
                  </span>
                  <PlusIcon width={14} height={14} color="var(--gray-9)" />
                </button>
              ))}
            </div>
            {adding ? (
              <div className="addr-form">
                <input
                  className="cp-input" placeholder="List name — e.g. Mehta wardrobe job" autoFocus
                  value={name} onChange={(e) => setName(e.target.value)}
                />
                <Button size="2" color="green" style={{ fontWeight: 800, width: '100%' }} disabled={!name.trim()} onClick={create}>
                  Create & save here
                </Button>
              </div>
            ) : (
              <button className="addr-add" onClick={() => setAdding(true)}>
                <PlusIcon width={14} height={14} /> New project list
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
