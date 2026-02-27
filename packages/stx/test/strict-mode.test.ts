import { describe, expect, it, spyOn } from 'bun:test'
import { validateClientScript } from '../src/process'

describe('Strict Mode - validateClientScript', () => {
  describe('document.* patterns', () => {
    it('warns on document.getElementById', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('document.getElementById("foo")', 'test.stx')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('document.getElementById')
      expect(spy.mock.calls[0][0]).toContain('useRef')
      spy.mockRestore()
    })

    it('warns on document.querySelector', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('document.querySelector(".btn")', 'test.stx')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('document.querySelector')
      spy.mockRestore()
    })

    it('warns on document.querySelectorAll', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('document.querySelectorAll("li")', 'test.stx')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('document.querySelectorAll')
      spy.mockRestore()
    })

    it('warns on document.createElement', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('document.createElement("div")', 'test.stx')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('document.createElement')
      spy.mockRestore()
    })

    it('warns on document.title assignment', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('document.title = "Hello"', 'test.stx')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('document.title')
      expect(spy.mock.calls[0][0]).toContain('useTitle()')
      spy.mockRestore()
    })

    it('warns on document.cookie', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('const c = document.cookie', 'test.stx')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('document.cookie')
      expect(spy.mock.calls[0][0]).toContain('useCookie()')
      spy.mockRestore()
    })

    it('warns on document.addEventListener', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('document.addEventListener("click", fn)', 'test.stx')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('useEventListener()')
      spy.mockRestore()
    })
  })

  describe('window.* patterns', () => {
    it('warns on window.location', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('window.location.href = "/new"', 'test.stx')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('window.location')
      expect(spy.mock.calls[0][0]).toContain('navigate()')
      spy.mockRestore()
    })

    it('warns on window.history', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('window.history.back()', 'test.stx')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('window.history')
      expect(spy.mock.calls[0][0]).toContain('goBack()')
      spy.mockRestore()
    })

    it('warns on window.addEventListener', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('window.addEventListener("resize", fn)', 'test.stx')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('useEventListener()')
      spy.mockRestore()
    })

    it('warns on window.localStorage', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('window.localStorage.getItem("key")', 'test.stx')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('useLocalStorage()')
      spy.mockRestore()
    })

    it('warns on window.sessionStorage', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('window.sessionStorage.setItem("k", "v")', 'test.stx')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('useSessionStorage()')
      spy.mockRestore()
    })

    it('warns on window.scrollTo', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('window.scrollTo(0, 0)', 'test.stx')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('useScroll()')
      spy.mockRestore()
    })

    it('warns on window.alert', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('window.alert("hi")', 'test.stx')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('modal/dialog')
      spy.mockRestore()
    })

    it('warns on window.confirm', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('window.confirm("sure?")', 'test.stx')
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    it('warns on window.prompt', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('window.prompt("name?")', 'test.stx')
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe('bare location patterns', () => {
    it('warns on location.href assignment', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('location.href = "/page"', 'test.stx')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('navigate()')
      spy.mockRestore()
    })

    it('warns on location.assign', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('location.assign("/page")', 'test.stx')
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    it('warns on location.replace', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('location.replace("/page")', 'test.stx')
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe('clean code passes', () => {
    it('does not warn on valid stx code', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript(`
        const count = state(0)
        const input = useRef('myInput')
        navigate('/about')
        const route = useRoute()
      `, 'test.stx')
      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe('strict mode: true', () => {
    it('throws on violations when strict is true', () => {
      expect(() => {
        validateClientScript('document.getElementById("foo")', 'test.stx', true)
      }).toThrow('DOM API violation')
    })

    it('does not throw on clean code when strict is true', () => {
      expect(() => {
        validateClientScript('const count = state(0)', 'test.stx', true)
      }).not.toThrow()
    })
  })

  describe('strict mode: config object', () => {
    it('throws when failOnViolation is true', () => {
      expect(() => {
        validateClientScript('document.querySelector(".x")', 'test.stx', {
          enabled: true,
          failOnViolation: true,
        })
      }).toThrow('DOM API violation')
    })

    it('warns but does not throw when failOnViolation is false', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      expect(() => {
        validateClientScript('document.querySelector(".x")', 'test.stx', {
          enabled: true,
          failOnViolation: false,
        })
      }).not.toThrow()
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    it('allows specific patterns with allowPatterns', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript('document.querySelector(".x")', 'test.stx', {
        enabled: true,
        allowPatterns: ['querySelector'],
      })
      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })

    it('only allows specified patterns, still catches others', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript(`
        document.querySelector(".x")
        window.alert("hi")
      `, 'test.stx', {
        enabled: true,
        allowPatterns: ['querySelector'],
      })
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('window.alert')
      expect(spy.mock.calls[0][0]).not.toContain('querySelector')
      spy.mockRestore()
    })
  })

  describe('multiple violations', () => {
    it('reports all violations in one message', () => {
      const spy = spyOn(console, 'warn').mockImplementation(() => {})
      validateClientScript(`
        document.getElementById("a")
        window.location.href = "/b"
        window.alert("c")
      `, 'test.stx')
      expect(spy).toHaveBeenCalledTimes(1)
      const msg = spy.mock.calls[0][0]
      expect(msg).toContain('getElementById')
      expect(msg).toContain('window.location')
      expect(msg).toContain('window.alert')
      spy.mockRestore()
    })
  })
})
