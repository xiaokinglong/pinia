import { createPinia, defineStore, MutationType, setActivePinia } from '../src'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

describe('Subscriptions', () => {
  const useStore = defineStore({
    id: 'main',
    state: () => ({
      user: 'Eduardo',
    }),
  })

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('fires callback when patch is applied', () => {
    const store = useStore()
    const spy = jest.fn()
    store.$subscribe(spy, { flush: 'sync' })
    store.$state.user = 'Cleiton'
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 'main',
        type: MutationType.direct,
      }),
      store.$state
    )
  })

  it('subscribe to changes done via patch', () => {
    const store = useStore()
    const spy = jest.fn()
    store.$subscribe(spy, { flush: 'sync' })

    const patch = { user: 'Cleiton' }
    store.$patch(patch)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: patch,
        storeId: 'main',
        type: MutationType.patchObject,
      }),
      store.$state
    )
  })

  it('unsubscribes callback when unsubscribe is called', () => {
    const spy = jest.fn()
    const store = useStore()
    const unsubscribe = store.$subscribe(spy, { flush: 'sync' })
    unsubscribe()
    store.$state.user = 'Cleiton'
    expect(spy).not.toHaveBeenCalled()
  })

  it('listeners are not affected when unsubscribe is called multiple times', () => {
    const func1 = jest.fn()
    const func2 = jest.fn()
    const store = useStore()
    const unsubscribe1 = store.$subscribe(func1, { flush: 'sync' })
    store.$subscribe(func2, { flush: 'sync' })
    unsubscribe1()
    unsubscribe1()
    store.$state.user = 'Cleiton'
    expect(func1).not.toHaveBeenCalled()
    expect(func2).toHaveBeenCalledTimes(1)
  })

  describe('multiple', () => {
    it('triggers subscribe only once', async () => {
      const s1 = useStore()
      const s2 = useStore()

      const spy1 = jest.fn()
      const spy2 = jest.fn()

      s1.$subscribe(spy1, { flush: 'sync' })
      s2.$subscribe(spy2, { flush: 'sync' })

      expect(spy1).toHaveBeenCalledTimes(0)
      expect(spy2).toHaveBeenCalledTimes(0)

      s1.user = 'Edu'

      expect(spy1).toHaveBeenCalledTimes(1)
      expect(spy2).toHaveBeenCalledTimes(1)
    })

    it('removes on unmount', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const spy1 = jest.fn()
      const spy2 = jest.fn()

      const wrapper = mount(
        {
          setup() {
            const s1 = useStore()
            s1.$subscribe(spy1, { flush: 'sync' })
          },
          template: `<p/>`,
        },
        { global: { plugins: [pinia] } }
      )

      const s1 = useStore()
      const s2 = useStore()

      s2.$subscribe(spy2, { flush: 'sync' })

      expect(spy1).toHaveBeenCalledTimes(0)
      expect(spy2).toHaveBeenCalledTimes(0)

      s1.user = 'Edu'
      expect(spy1).toHaveBeenCalledTimes(1)
      expect(spy2).toHaveBeenCalledTimes(1)

      s1.$patch({ user: 'a' })
      expect(spy1).toHaveBeenCalledTimes(2)
      expect(spy2).toHaveBeenCalledTimes(2)

      s1.$patch((state) => {
        state.user = 'other'
      })
      expect(spy1).toHaveBeenCalledTimes(3)
      expect(spy2).toHaveBeenCalledTimes(3)

      wrapper.unmount()
      await nextTick()

      s1.$patch({ user: 'b' })
      expect(spy1).toHaveBeenCalledTimes(3)
      expect(spy2).toHaveBeenCalledTimes(4)
      s1.$patch((state) => {
        state.user = 'c'
      })
      expect(spy1).toHaveBeenCalledTimes(3)
      expect(spy2).toHaveBeenCalledTimes(5)
      s1.user = 'd'
      expect(spy1).toHaveBeenCalledTimes(3)
      expect(spy2).toHaveBeenCalledTimes(6)
    })
  })

  it('subscribe is post by default', async () => {
    const spy = jest.fn()
    const store = useStore()
    store.$subscribe(spy)
    store.$state.user = 'Cleiton'
    expect(spy).toHaveBeenCalledTimes(0)
    await nextTick()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 'main',
        type: MutationType.direct,
      }),
      store.$state
    )
  })
})
