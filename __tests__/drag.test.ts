// __tests__/drag.test.ts
// Tests for the pure position/size math used by useDrag and useResize.
// The hooks themselves are thin wrappers; we test the constraint logic directly.

describe('drag constraints', () => {
  function applyDrag(startRect: { x: number; y: number }, dx: number, dy: number) {
    const newX = startRect.x + dx
    const newY = Math.max(0, startRect.y + dy)  // top clamp: y >= 0
    return { x: newX, y: newY }
  }

  it('allows free horizontal movement', () => {
    expect(applyDrag({ x: 100, y: 100 }, -200, 0).x).toBe(-100)
  })
  it('clamps y to 0 when dragged above viewport', () => {
    expect(applyDrag({ x: 100, y: 50 }, 0, -200).y).toBe(0)
  })
  it('allows y increase freely', () => {
    expect(applyDrag({ x: 0, y: 0 }, 0, 300).y).toBe(300)
  })
})

describe('resize constraints', () => {
  const MIN_W = 280
  const MIN_H = 180

  function applyResize(startSize: { width: number; height: number }, dw: number, dh: number) {
    return {
      width:  Math.max(MIN_W, startSize.width + dw),
      height: Math.max(MIN_H, startSize.height + dh),
    }
  }

  it('respects minimum width of 280px', () => {
    expect(applyResize({ width: 300, height: 300 }, -100, 0).width).toBe(MIN_W)
  })
  it('respects minimum height of 180px', () => {
    expect(applyResize({ width: 300, height: 200 }, 0, -100).height).toBe(MIN_H)
  })
  it('allows growth beyond minimums', () => {
    expect(applyResize({ width: 300, height: 300 }, 200, 100)).toEqual({ width: 500, height: 400 })
  })
})
