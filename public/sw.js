const CACHE_NAME = 'kindle-pdf-v3';

// インストール時にキャッシュ
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                './',
                './index.html',
                './manifest.json',
                './icon.jpg',
            ]);
        })
    );
    // 即座にアクティブ化
    self.skipWaiting();
});

// フェッチ時にキャッシュファーストで応答
self.addEventListener('fetch', (e) => {
    // POSTリクエストやChrome拡張機能のリクエストはスキップ
    if (e.request.method !== 'GET') return;
    if (e.request.url.startsWith('chrome-extension://')) return;

    e.respondWith(
        caches.match(e.request).then((response) => {
            if (response) {
                return response;
            }

            // ネットワークから取得してキャッシュに追加
            return fetch(e.request).then((fetchResponse) => {
                // 有効なレスポンスのみキャッシュ
                if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                    return fetchResponse;
                }

                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseToCache);
                });

                return fetchResponse;
            }).catch(() => {
                // オフライン時のフォールバック
                return caches.match('./index.html');
            });
        })
    );
});

// 古いキャッシュを削除
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    // 即座にクライアントを制御
    self.clients.claim();
});
