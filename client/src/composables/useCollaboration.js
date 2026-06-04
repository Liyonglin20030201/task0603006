import { ref, onUnmounted } from 'vue'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'
import { useAuthStore } from '../stores/auth.js'

export function useCollaboration(documentId) {
  const ydoc = new Y.Doc()
  const isConnected = ref(false)
  const isSynced = ref(false)
  const connectedUsers = ref([])

  const authStore = useAuthStore()

  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`

  const wsProvider = new WebsocketProvider(wsUrl, documentId, ydoc, {
    params: { token: authStore.accessToken }
  })

  const indexeddbProvider = new IndexeddbPersistence(documentId, ydoc)

  wsProvider.on('status', ({ status }) => {
    isConnected.value = status === 'connected'
  })

  wsProvider.on('sync', (synced) => {
    isSynced.value = synced
  })

  const awareness = wsProvider.awareness

  awareness.setLocalStateField('user', {
    name: authStore.user?.display_name || authStore.user?.username || 'Anonymous',
    color: generateColor(authStore.user?.id || 'default')
  })

  awareness.on('change', () => {
    const states = Array.from(awareness.getStates().entries())
    connectedUsers.value = states
      .filter(([clientId]) => clientId !== ydoc.clientID)
      .map(([, state]) => state.user)
      .filter(Boolean)
  })

  function destroy() {
    wsProvider.destroy()
    indexeddbProvider.destroy()
    ydoc.destroy()
  }

  onUnmounted(destroy)

  return {
    ydoc,
    wsProvider,
    awareness,
    isConnected,
    isSynced,
    connectedUsers,
    destroy
  }
}

function generateColor(userId) {
  const colors = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7',
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#ff9800'
  ]
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
