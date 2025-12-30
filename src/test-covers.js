// Простой тест для проверки API обложек
// Открыть консоль браузера и вставить этот код

console.log('Testing cover API...');

// Тестовый UUID трека  
const testTrackId = 'fd6eaafd-4b5d-4e4b-8dec-43247681a3a9';

// Тест 1: Проверим правильность URL
const testUrl = `http://localhost:8080/api/tracks/${testTrackId}/cover`;
console.log('Expected URL:', testUrl);

// Тест 2: Попробуем загрузить
fetch(testUrl)
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    if (response.ok) {
      console.log('✅ Cover API working correctly');
    } else {
      console.log('❌ Cover API not working, status:', response.status);
    }
  })
  .catch(error => {
    console.error('❌ Error testing cover API:', error);
  });

// Тест 3: Проверим tracksAPI.getCoverUrl
if (typeof tracksAPI !== 'undefined') {
  const apiUrl = tracksAPI.getCoverUrl(testTrackId);
  console.log('tracksAPI.getCoverUrl result:', apiUrl);
} else {
  console.log('tracksAPI not available in global scope');
}