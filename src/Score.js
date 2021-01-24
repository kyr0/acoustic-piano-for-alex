import React, { useRef, useEffect } from 'react'
import VexFlow from 'vexflow'

const VF = VexFlow.Flow
const { Formatter, Renderer, Stave, StaveNote } = VF

const clefAndTimeWidth = 60

let renderer;
let rendered;

export function Score({
  staves = [],
  clef = 'treble',
  timeSignature = '4/4',
  width = 450,
  height = 150,
}) {
  const container = useRef()

  useEffect(() => {
    if (!renderer) {
      renderer = new Renderer(
        container.current,
        Renderer.Backends.SVG
      )
    }

    renderer.resize(width, height)
    const context = renderer.getContext()

    if (rendered && container.current.querySelector('svg')) {
        // removes all what has been rendered before
        container.current.querySelector('svg').innerHTML = ''
    }

    context.setFont('Arial', 10, '').setBackgroundFillStyle('#eed')
    const staveWidth = (width - clefAndTimeWidth) / staves.length

    let currX = 0
    staves.forEach((notes, i) => {
      const stave = new Stave(currX, 0, staveWidth)
      if (i === 0) {
        stave.setWidth(staveWidth + clefAndTimeWidth)
        stave.addClef(clef).addTimeSignature(timeSignature)
      }
      currX += stave.getWidth()
      stave.setContext(context).draw()

      const processedNotes = notes
        .map(note => (typeof note === 'string' ? { key: note } : note))
        .map(note =>
          Array.isArray(note) ? { key: note[0], duration: note[1] } : note
        )
        .map(({ key, ...rest }) =>
          typeof key === 'string'
            ? {
                key: key.includes('/') ? key : `${key[0]}/${key.slice(1)}`,
                ...rest,
              }
            : rest
        )
        .map(
          ({ key, keys, duration = 'q' }) =>
            new StaveNote({
              keys: key ? [key] : keys,
              duration: String(duration),
            })
        )
      rendered = Formatter.FormatAndDraw(context, stave, processedNotes, {

        auto_beam: true,
      })
    })
  }, [staves])

  return <div ref={container} />
}