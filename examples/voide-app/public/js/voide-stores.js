/**
 * Voide Stores - Browser Bundle
 * Auto-generated, do not edit
 */
window.VoideStores = (function() {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __moduleCache = /* @__PURE__ */ new WeakMap;
  var __toCommonJS = (from) => {
    var entry = __moduleCache.get(from), desc;
    if (entry)
      return entry;
    entry = __defProp({}, "__esModule", { value: true });
    if (from && typeof from === "object" || typeof from === "function")
      __getOwnPropNames(from).map((key) => !__hasOwnProp.call(entry, key) && __defProp(entry, key, {
        get: () => from[key],
        enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
      }));
    __moduleCache.set(from, entry);
    return entry;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, {
        get: all[name],
        enumerable: true,
        configurable: true,
        set: (newValue) => all[name] = () => newValue
      });
  };

  // lib/stores/index.ts
  var exports_stores = {};
  __export(exports_stores, {
    useWindowSize: () => useWindowSize,
    useVisibility: () => useVisibility,
    useTitle: () => useTitle,
    useStorage: () => useStorage,
    useSessionStorage: () => useSessionStorage,
    useScroll: () => useScroll,
    usePreferredReducedMotion: () => usePreferredReducedMotion,
    usePreferredDark: () => usePreferredDark,
    useOnline: () => useOnline,
    useNetwork: () => useNetwork,
    useMediaQuery: () => useMediaQuery,
    useLocalStorage: () => useLocalStorage,
    useIsMobile: () => useIsMobile,
    useIsDesktop: () => useIsDesktop,
    useFavicon: () => useFavicon,
    useCookie: () => useCookie,
    useClipboard: () => useClipboard,
    uiStore: () => uiStore,
    uiActions: () => uiActions,
    settingsStore: () => settingsStore,
    settingsActions: () => settingsActions,
    setCookie: () => setCookie,
    removeCookie: () => removeCookie,
    parseCookies: () => parseCookies,
    getStorageKeys: () => getStorageKeys,
    getCookie: () => getCookie,
    createStore: () => createStore,
    copyToClipboard: () => copyToClipboard,
    computed: () => computed,
    clearStorage: () => clearStorage,
    clearCookies: () => clearCookies,
    chatStore: () => chatStore,
    chatActions: () => chatActions,
    appStore: () => appStore,
    appActions: () => appActions
  });

  // lib/store.ts
  function createStore(initialValue, options = {}) {
    const { name, persist, onChange } = options;
    let currentValue = { ...initialValue };
    const subscribers = new Set;
    let persistTimeout = null;
    if (persist && typeof window !== "undefined") {
      const storage = persist.storage === "session" ? sessionStorage : localStorage;
      const key = persist.key || `voide:${name || "store"}`;
      try {
        const stored = storage.getItem(key);
        if (stored) {
          currentValue = { ...initialValue, ...JSON.parse(stored) };
        }
      } catch {}
    }
    const persistValue = (value) => {
      if (!persist || typeof window === "undefined")
        return;
      const storage = persist.storage === "session" ? sessionStorage : localStorage;
      const key = persist.key || `voide:${name || "store"}`;
      if (persist.debounce) {
        if (persistTimeout)
          clearTimeout(persistTimeout);
        persistTimeout = setTimeout(() => {
          storage.setItem(key, JSON.stringify(value));
        }, persist.debounce);
      } else {
        storage.setItem(key, JSON.stringify(value));
      }
    };
    const notify = (newValue, prevValue) => {
      for (const subscriber of subscribers) {
        try {
          subscriber(newValue, prevValue);
        } catch (error) {
          console.error("[voide-store] Subscriber error:", error);
        }
      }
      if (onChange) {
        onChange(newValue, prevValue);
      }
    };
    const store = {
      get: () => currentValue,
      set: (value) => {
        const prevValue = currentValue;
        const newValue = typeof value === "function" ? value(currentValue) : value;
        if (newValue !== prevValue) {
          currentValue = newValue;
          persistValue(newValue);
          notify(newValue, prevValue);
        }
      },
      update: (partial) => {
        const prevValue = currentValue;
        const updates = typeof partial === "function" ? partial(currentValue) : partial;
        const newValue = { ...currentValue, ...updates };
        currentValue = newValue;
        persistValue(newValue);
        notify(newValue, prevValue);
      },
      subscribe: (subscriber) => {
        subscribers.add(subscriber);
        subscriber(currentValue, undefined);
        return () => {
          subscribers.delete(subscriber);
        };
      },
      reset: () => {
        const prevValue = currentValue;
        currentValue = { ...initialValue };
        persistValue(currentValue);
        notify(currentValue, prevValue);
      },
      name
    };
    return store;
  }
  function computed(stores, compute) {
    const getValues = () => stores.map((s) => s.get());
    let currentValue = compute(...getValues());
    const subscribers = new Set;
    for (const sourceStore of stores) {
      sourceStore.subscribe(() => {
        const newValue = compute(...getValues());
        if (newValue !== currentValue) {
          const prevValue = currentValue;
          currentValue = newValue;
          for (const subscriber of subscribers) {
            subscriber(newValue, prevValue);
          }
        }
      });
    }
    return {
      get: () => currentValue,
      subscribe: (subscriber) => {
        subscribers.add(subscriber);
        return () => subscribers.delete(subscriber);
      }
    };
  }

  // lib/stores/app.ts
  var appStore = createStore({
    isRecording: false,
    isProcessing: false,
    transcript: "",
    repoPath: "",
    hasChanges: false,
    speechSupported: false,
    currentDriver: "claude-cli-local",
    isNativeApp: false,
    terminalTitle: "Voide - Ready"
  }, {
    name: "app",
    persist: {
      key: "voide:app",
      storage: "local"
    }
  });
  var appActions = {
    setRecording: (isRecording) => {
      appStore.update({ isRecording });
    },
    setProcessing: (isProcessing) => {
      appStore.update({ isProcessing });
    },
    setTranscript: (transcript) => {
      appStore.update({ transcript });
    },
    setRepoPath: (repoPath) => {
      appStore.update({ repoPath });
    },
    setHasChanges: (hasChanges) => {
      appStore.update({ hasChanges });
    },
    setTerminalTitle: (terminalTitle) => {
      appStore.update({ terminalTitle });
    },
    setDriver: (currentDriver) => {
      appStore.update({ currentDriver });
    },
    setNativeApp: (isNativeApp) => {
      appStore.update({ isNativeApp });
    },
    setSpeechSupported: (speechSupported) => {
      appStore.update({ speechSupported });
    }
  };
  // lib/stores/chat.ts
  var STORAGE_KEY_CHATS = "voide:chats";
  var STORAGE_KEY_CHAT_COUNTER = "voide:chat_counter";
  var chatStore = createStore({
    currentChatId: null,
    messages: [],
    inputText: "",
    charCount: 0
  }, {
    name: "chat"
  });
  function getAllChats() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_CHATS) || "{}");
    } catch {
      return {};
    }
  }
  function saveAllChats(chats) {
    localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chats));
  }
  var chatActions = {
    generateChatId: () => {
      const counter = parseInt(localStorage.getItem(STORAGE_KEY_CHAT_COUNTER) || "0", 10) + 1;
      localStorage.setItem(STORAGE_KEY_CHAT_COUNTER, counter.toString());
      return counter.toString();
    },
    getChatIdFromUrl: () => {
      const match = window.location.pathname.match(/^\/chat\/(\d+)$/);
      return match ? match[1] : null;
    },
    getAllChats,
    startNewChat: (repoPath = "", driver = "claude-cli-local") => {
      const chatId = chatActions.generateChatId();
      chatStore.update({
        currentChatId: chatId,
        messages: []
      });
      const chats = getAllChats();
      chats[chatId] = {
        id: chatId,
        messages: [],
        repoPath,
        driver,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      saveAllChats(chats);
      history.pushState({ chatId }, "", `/chat/${chatId}`);
      return chatId;
    },
    loadChat: (chatId) => {
      const chats = getAllChats();
      const chat = chats[chatId];
      if (chat) {
        chatStore.update({
          currentChatId: chatId,
          messages: chat.messages || []
        });
        return true;
      }
      return false;
    },
    saveCurrentChat: (repoPath, driver) => {
      const state = chatStore.get();
      if (!state.currentChatId)
        return;
      const chats = getAllChats();
      chats[state.currentChatId] = {
        id: state.currentChatId,
        messages: state.messages,
        repoPath,
        driver,
        createdAt: chats[state.currentChatId]?.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      saveAllChats(chats);
    },
    deleteChat: (chatId) => {
      const chats = getAllChats();
      delete chats[chatId];
      saveAllChats(chats);
    },
    addMessage: (type, content, header) => {
      const state = chatStore.get();
      const driverName = header || (type === "user" ? "You" : type === "assistant" ? "AI" : type === "system" ? "System" : "Error");
      const newMessage = {
        type,
        content,
        header: driverName,
        timestamp: Date.now()
      };
      chatStore.update({
        messages: [...state.messages, newMessage]
      });
      return newMessage;
    },
    updateLastMessage: (type, content) => {
      const state = chatStore.get();
      const messages = [...state.messages];
      if (messages.length > 0 && messages[messages.length - 1].type === type) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content,
          updated: Date.now()
        };
        chatStore.update({ messages });
      }
    },
    removeLastMessage: () => {
      const state = chatStore.get();
      if (state.messages.length > 0) {
        chatStore.update({
          messages: state.messages.slice(0, -1)
        });
      }
    },
    clearMessages: () => {
      chatStore.update({ messages: [] });
    },
    setInputText: (inputText) => {
      chatStore.update({
        inputText,
        charCount: inputText.length
      });
    },
    clearInput: () => {
      chatStore.update({
        inputText: "",
        charCount: 0
      });
    },
    newChat: () => {
      chatStore.update({
        currentChatId: null,
        messages: []
      });
      history.pushState({}, "", "/");
    }
  };
  // lib/stores/settings.ts
  var settingsStore = createStore({
    apiKeys: {
      anthropic: null,
      openai: null,
      claudeCliHost: null
    },
    github: {
      connected: false,
      token: null,
      username: null,
      name: null,
      email: null,
      avatarUrl: null
    },
    lastRepoPath: null
  }, {
    name: "settings",
    persist: {
      key: "voide:settings",
      storage: "local"
    }
  });
  var settingsActions = {
    setApiKey: (provider, key) => {
      const state = settingsStore.get();
      settingsStore.update({
        apiKeys: {
          ...state.apiKeys,
          [provider]: key
        }
      });
    },
    setAllApiKeys: (keys) => {
      settingsStore.update({ apiKeys: keys });
    },
    setGithub: (github) => {
      const state = settingsStore.get();
      settingsStore.update({
        github: { ...state.github, ...github }
      });
    },
    connectGithub: (data) => {
      settingsStore.update({
        github: {
          connected: true,
          token: data.token,
          username: data.username,
          name: data.name || null,
          email: data.email || null,
          avatarUrl: data.avatarUrl || null
        }
      });
    },
    disconnectGithub: () => {
      settingsStore.update({
        github: {
          connected: false,
          token: null,
          username: null,
          name: null,
          email: null,
          avatarUrl: null
        }
      });
    },
    setLastRepoPath: (path) => {
      settingsStore.update({ lastRepoPath: path });
    }
  };
  // lib/stores/ui.ts
  var uiStore = createStore({
    modals: {
      github: false,
      settings: false
    },
    notifications: []
  }, {
    name: "ui"
  });
  var uiActions = {
    openModal: (modal) => {
      const state = uiStore.get();
      uiStore.update({
        modals: { ...state.modals, [modal]: true }
      });
    },
    closeModal: (modal) => {
      const state = uiStore.get();
      uiStore.update({
        modals: { ...state.modals, [modal]: false }
      });
    },
    closeAllModals: () => {
      uiStore.update({
        modals: {
          github: false,
          settings: false
        }
      });
    },
    toggleModal: (modal) => {
      const state = uiStore.get();
      uiStore.update({
        modals: { ...state.modals, [modal]: !state.modals[modal] }
      });
    },
    notify: (type, message, duration = 3000) => {
      const state = uiStore.get();
      const id = `notification-${Date.now()}`;
      uiStore.update({
        notifications: [...state.notifications, { id, type, message, duration }]
      });
      if (duration > 0) {
        setTimeout(() => {
          uiActions.dismissNotification(id);
        }, duration);
      }
      return id;
    },
    dismissNotification: (id) => {
      const state = uiStore.get();
      uiStore.update({
        notifications: state.notifications.filter((n) => n.id !== id)
      });
    },
    clearNotifications: () => {
      uiStore.update({ notifications: [] });
    }
  };
  // lib/composables/use-storage.ts
  function useStorage(key, defaultValue, options = {}) {
    const {
      storage = "local",
      mergeDefaults = false,
      listenToStorageChanges = true
    } = options;
    const subscribers = new Set;
    const isClient = typeof window !== "undefined";
    const getStorage = () => {
      if (!isClient)
        return null;
      return storage === "session" ? sessionStorage : localStorage;
    };
    const read = () => {
      const store = getStorage();
      if (!store)
        return defaultValue;
      try {
        const raw = store.getItem(key);
        if (raw === null)
          return defaultValue;
        const parsed = JSON.parse(raw);
        if (mergeDefaults && typeof defaultValue === "object" && defaultValue !== null) {
          return { ...defaultValue, ...parsed };
        }
        return parsed;
      } catch {
        return defaultValue;
      }
    };
    const write = (value) => {
      const store = getStorage();
      if (!store)
        return;
      try {
        if (value === null || value === undefined) {
          store.removeItem(key);
        } else {
          store.setItem(key, JSON.stringify(value));
        }
      } catch (e) {
        console.warn(`[useStorage] Failed to write key "${key}":`, e);
      }
    };
    let currentValue = read();
    const notify = (newValue, prevValue) => {
      for (const callback of subscribers) {
        try {
          callback(newValue, prevValue);
        } catch (e) {
          console.error("[useStorage]", e);
        }
      }
    };
    if (isClient && listenToStorageChanges) {
      window.addEventListener("storage", (event) => {
        if (event.key === key && event.storageArea === getStorage()) {
          const prevValue = currentValue;
          currentValue = event.newValue ? JSON.parse(event.newValue) : defaultValue;
          notify(currentValue, prevValue);
        }
      });
    }
    const ref = {
      get value() {
        return currentValue;
      },
      set value(newValue) {
        const prevValue = currentValue;
        currentValue = newValue;
        write(newValue);
        notify(newValue, prevValue);
      },
      get: () => currentValue,
      set: (value) => {
        ref.value = value;
      },
      remove: () => {
        const store = getStorage();
        if (store) {
          store.removeItem(key);
          const prevValue = currentValue;
          currentValue = defaultValue;
          notify(defaultValue, prevValue);
        }
      },
      subscribe: (callback) => {
        subscribers.add(callback);
        callback(currentValue, undefined);
        return () => subscribers.delete(callback);
      }
    };
    return ref;
  }
  function useLocalStorage(key, defaultValue, options) {
    return useStorage(key, defaultValue, { ...options, storage: "local" });
  }
  function useSessionStorage(key, defaultValue, options) {
    return useStorage(key, defaultValue, { ...options, storage: "session" });
  }
  function clearStorage(type = "local") {
    if (typeof window === "undefined")
      return;
    const storage = type === "session" ? sessionStorage : localStorage;
    storage.clear();
  }
  function getStorageKeys(type = "local") {
    if (typeof window === "undefined")
      return [];
    const storage = type === "session" ? sessionStorage : localStorage;
    return Object.keys(storage);
  }
  // lib/composables/use-cookie.ts
  function parseCookies() {
    if (typeof document === "undefined")
      return {};
    const cookies = {};
    const pairs = document.cookie.split(";");
    for (const pair of pairs) {
      const [key, ...valueParts] = pair.trim().split("=");
      if (key) {
        try {
          cookies[key] = decodeURIComponent(valueParts.join("="));
        } catch {
          cookies[key] = valueParts.join("=");
        }
      }
    }
    return cookies;
  }
  function getCookie(name) {
    return parseCookies()[name] ?? null;
  }
  function setCookie(name, value, options = {}) {
    if (typeof document === "undefined")
      return;
    const { maxAge, expires, path = "/", domain, secure, sameSite = "lax" } = options;
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    if (maxAge !== undefined)
      cookieString += `; max-age=${maxAge}`;
    if (expires !== undefined) {
      const expiresDate = expires instanceof Date ? expires : typeof expires === "number" ? new Date(Date.now() + expires * 1000) : new Date(expires);
      cookieString += `; expires=${expiresDate.toUTCString()}`;
    }
    if (path)
      cookieString += `; path=${path}`;
    if (domain)
      cookieString += `; domain=${domain}`;
    if (secure)
      cookieString += "; secure";
    if (sameSite)
      cookieString += `; samesite=${sameSite}`;
    document.cookie = cookieString;
  }
  function removeCookie(name, options = {}) {
    setCookie(name, "", { ...options, maxAge: 0, expires: new Date(0) });
  }
  function useCookie(name, options = {}) {
    const { default: defaultValue = null } = options;
    const subscribers = new Set;
    let pollInterval = null;
    const read = () => {
      if (typeof document === "undefined")
        return defaultValue;
      const raw = getCookie(name);
      if (raw === null)
        return defaultValue;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    };
    let currentValue = read();
    const notify = (newValue, prevValue) => {
      for (const callback of subscribers) {
        try {
          callback(newValue, prevValue);
        } catch (e) {
          console.error("[useCookie]", e);
        }
      }
    };
    const startPolling = () => {
      if (pollInterval || typeof document === "undefined")
        return;
      pollInterval = setInterval(() => {
        const newValue = read();
        if (JSON.stringify(newValue) !== JSON.stringify(currentValue)) {
          const prevValue = currentValue;
          currentValue = newValue;
          notify(newValue, prevValue);
        }
      }, 1000);
    };
    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };
    const ref = {
      get value() {
        return currentValue;
      },
      set value(newValue) {
        const prevValue = currentValue;
        currentValue = newValue;
        if (newValue === null)
          removeCookie(name, options);
        else
          setCookie(name, typeof newValue === "string" ? newValue : JSON.stringify(newValue), options);
        notify(newValue, prevValue);
      },
      get: () => currentValue,
      set: (value, customOptions) => {
        const prevValue = currentValue;
        currentValue = value;
        setCookie(name, typeof value === "string" ? value : JSON.stringify(value), { ...options, ...customOptions });
        notify(value, prevValue);
      },
      remove: () => {
        const prevValue = currentValue;
        currentValue = null;
        removeCookie(name, options);
        notify(null, prevValue);
      },
      subscribe: (callback) => {
        subscribers.add(callback);
        callback(currentValue, null);
        if (subscribers.size === 1)
          startPolling();
        return () => {
          subscribers.delete(callback);
          if (subscribers.size === 0)
            stopPolling();
        };
      }
    };
    return ref;
  }
  function clearCookies(options = {}) {
    for (const name of Object.keys(parseCookies()))
      removeCookie(name, options);
  }
  // lib/composables/use-browser.ts
  function useClipboard(options = {}) {
    const { timeout = 1500 } = options;
    let currentText = "";
    let copied = false;
    let copiedTimeout = null;
    const isSupported = typeof navigator !== "undefined" && "clipboard" in navigator;
    const copy = async (text) => {
      try {
        if (isSupported) {
          await navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.cssText = "position:fixed;opacity:0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
        currentText = text;
        copied = true;
        if (copiedTimeout)
          clearTimeout(copiedTimeout);
        copiedTimeout = setTimeout(() => {
          copied = false;
        }, timeout);
        return true;
      } catch {
        return false;
      }
    };
    const read = async () => {
      if (!isSupported)
        return "";
      try {
        return await navigator.clipboard.readText();
      } catch {
        return "";
      }
    };
    return {
      get text() {
        return currentText;
      },
      get isSupported() {
        return isSupported;
      },
      get copied() {
        return copied;
      },
      copy,
      read
    };
  }
  async function copyToClipboard(text) {
    return useClipboard().copy(text);
  }
  function useMediaQuery(query) {
    const subscribers = new Set;
    const isClient = typeof window !== "undefined";
    let currentMatches = false;
    if (isClient) {
      const mediaQuery = window.matchMedia(query);
      currentMatches = mediaQuery.matches;
      const handler = (event) => {
        currentMatches = event.matches;
        for (const cb of subscribers) {
          try {
            cb(event.matches);
          } catch {}
        }
      };
      if (mediaQuery.addEventListener)
        mediaQuery.addEventListener("change", handler);
      else
        mediaQuery.addListener(handler);
    }
    return {
      get matches() {
        return currentMatches;
      },
      subscribe: (callback) => {
        subscribers.add(callback);
        callback(currentMatches);
        return () => subscribers.delete(callback);
      }
    };
  }
  function usePreferredDark() {
    return useMediaQuery("(prefers-color-scheme: dark)");
  }
  function usePreferredReducedMotion() {
    return useMediaQuery("(prefers-reduced-motion: reduce)");
  }
  function useIsMobile() {
    return useMediaQuery("(max-width: 767px)");
  }
  function useIsDesktop() {
    return useMediaQuery("(min-width: 1024px)");
  }
  function useNetwork() {
    const subscribers = new Set;
    const isClient = typeof window !== "undefined";
    const getConnection = () => isClient ? navigator.connection : null;
    const getState = () => {
      if (!isClient)
        return { isOnline: true, isOffline: false, effectiveType: null, downlink: null, saveData: false };
      const conn = getConnection();
      return {
        isOnline: navigator.onLine,
        isOffline: !navigator.onLine,
        effectiveType: conn?.effectiveType || null,
        downlink: conn?.downlink || null,
        saveData: conn?.saveData || false
      };
    };
    let currentState = getState();
    const notify = () => {
      currentState = getState();
      for (const cb of subscribers) {
        try {
          cb(currentState);
        } catch {}
      }
    };
    if (isClient) {
      window.addEventListener("online", notify);
      window.addEventListener("offline", notify);
      getConnection()?.addEventListener("change", notify);
    }
    return {
      get isOnline() {
        return currentState.isOnline;
      },
      get isOffline() {
        return currentState.isOffline;
      },
      get effectiveType() {
        return currentState.effectiveType;
      },
      get downlink() {
        return currentState.downlink;
      },
      get saveData() {
        return currentState.saveData;
      },
      subscribe: (callback) => {
        subscribers.add(callback);
        callback(currentState);
        return () => subscribers.delete(callback);
      }
    };
  }
  function useOnline() {
    const network = useNetwork();
    return {
      get isOnline() {
        return network.isOnline;
      },
      subscribe: (cb) => network.subscribe((s) => cb(s.isOnline))
    };
  }
  function useWindowSize() {
    const subscribers = new Set;
    const isClient = typeof window !== "undefined";
    let current = { width: isClient ? window.innerWidth : 0, height: isClient ? window.innerHeight : 0 };
    if (isClient) {
      window.addEventListener("resize", () => {
        current = { width: window.innerWidth, height: window.innerHeight };
        for (const cb of subscribers) {
          try {
            cb(current);
          } catch {}
        }
      }, { passive: true });
    }
    return {
      get width() {
        return current.width;
      },
      get height() {
        return current.height;
      },
      subscribe: (callback) => {
        subscribers.add(callback);
        callback(current);
        return () => subscribers.delete(callback);
      }
    };
  }
  function useScroll() {
    const subscribers = new Set;
    const isClient = typeof window !== "undefined";
    let current = { x: isClient ? window.scrollX : 0, y: isClient ? window.scrollY : 0 };
    if (isClient) {
      window.addEventListener("scroll", () => {
        current = { x: window.scrollX, y: window.scrollY };
        for (const cb of subscribers) {
          try {
            cb(current);
          } catch {}
        }
      }, { passive: true });
    }
    return {
      get x() {
        return current.x;
      },
      get y() {
        return current.y;
      },
      subscribe: (callback) => {
        subscribers.add(callback);
        callback(current);
        return () => subscribers.delete(callback);
      },
      scrollTo: (x, y) => isClient && window.scrollTo(x, y),
      scrollToTop: () => isClient && window.scrollTo({ top: 0, behavior: "smooth" }),
      scrollToBottom: () => isClient && window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
    };
  }
  function useVisibility() {
    const subscribers = new Set;
    const isClient = typeof document !== "undefined";
    let isVisible = isClient ? document.visibilityState === "visible" : true;
    if (isClient) {
      document.addEventListener("visibilitychange", () => {
        isVisible = document.visibilityState === "visible";
        for (const cb of subscribers) {
          try {
            cb(isVisible);
          } catch {}
        }
      });
    }
    return {
      get isVisible() {
        return isVisible;
      },
      subscribe: (callback) => {
        subscribers.add(callback);
        callback(isVisible);
        return () => subscribers.delete(callback);
      }
    };
  }
  function useTitle(initialTitle) {
    const isClient = typeof document !== "undefined";
    if (initialTitle && isClient)
      document.title = initialTitle;
    return {
      get value() {
        return isClient ? document.title : "";
      },
      set value(title) {
        if (isClient)
          document.title = title;
      },
      set: (title) => {
        if (isClient)
          document.title = title;
      }
    };
  }
  function useFavicon(href) {
    const isClient = typeof document !== "undefined";
    const getLink = () => {
      if (!isClient)
        return null;
      let link = document.querySelector('link[rel*="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      return link;
    };
    if (href) {
      const link = getLink();
      if (link)
        link.href = href;
    }
    return {
      get value() {
        return getLink()?.href || "";
      },
      set value(newHref) {
        const link = getLink();
        if (link)
          link.href = newHref;
      },
      set: (newHref) => {
        const link = getLink();
        if (link)
          link.href = newHref;
      }
    };
  }
  return exports_stores;
})();
