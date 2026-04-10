
const setLocalStorageItem = (key: string, value: string): void => {
    localStorage.setItem(key, value);
}

const removeLocalStorageItem = (key: string): void => {
    localStorage.removeItem(key);
}

export {
    setLocalStorageItem,
    removeLocalStorageItem,
}
