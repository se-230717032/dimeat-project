# Dated Weight Logging and Firestore Sync

This implementation validates user-submitted weight entries (checking authentication, valid range between 15–500 kg, and non-future dates), saves them locally via `AsyncStorage` first, and synchronizes pending records to the Firestore `weightHistory` subcollection using `runTransaction`. If synchronization fails, it automatically retries after 10 seconds.

```ts
const pending = local.find((record) => !record.synced);
  useEffect(() => {
    if (!db || !uid || !pending) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ref = doc(db, 'users', uid, 'weightHistory', pending.entry.id);
    void runTransaction(db, async (transaction) => {
      if (!(await transaction.get(ref)).exists()) transaction.set(ref, pending.entry);
    }).then(async () => {
      const synced: LocalWeight = { ...pending, synced: true };
      await AsyncStorage.setItem(prefix + pending.entry.id, JSON.stringify(synced));
      if (!active) return;
      setLocal((items) => items.map((item) => item.entry.id === synced.entry.id ? synced : item));
      setSyncError(false);
    }).catch(() => {
      if (!active) return;
      setSyncError(true);
      timer = setTimeout(() => setRetry((value) => value + 1), 10000);
    });
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [db, uid, prefix, pending, retry, attempt]);

  const recordWeight = async (weight: number, day: string) => {
    if (!db || !uid) throw new Error('Kilo kaydetmek için giriş yap.');
    if (!Number.isFinite(weight) || weight < 15 || weight > 500) {
      throw new Error('Kilo 15 ile 500 kg arasında olmalı.');
    }
    const now = new Date();
    if (ageFromBirthDate(day, now) === null) {
      throw new Error('Bugün veya daha eski bir tartım tarihi gir.');
    }
    const isToday = day === dateKey(now);
    const recordedAt = (isToday ? now : new Date(day + 'T12:00:00')).toISOString();
    const generatedId = doc(collection(db, 'users', uid, 'weightHistory')).id;
    const entry: WeightRecord = {
      id: isToday ? 'current-' + generatedId : generatedId,
      user_id: uid,
      weight_kg: weight,
      recorded_at: recordedAt,
    };
    const cached: LocalWeight = { entry, synced: false };
    await AsyncStorage.setItem(prefix + entry.id, JSON.stringify(cached));
    setLocal((items) => [...items, cached]);
  };
```
