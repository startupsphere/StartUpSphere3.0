# 🚀 Quick Reference - Paginated Endpoints

## 📋 Most Common Endpoints

### 1. Get All Startups
```http
GET /startups?page=0&size=10&sortBy=id&sortDir=DESC
```

### 2. Search Startups
```http
GET /startups/search?query=tech&page=0&size=10&sortBy=companyName&sortDir=ASC
```

### 3. Get Approved Startups (Public)
```http
GET /startups/approved?page=0&size=20&sortBy=createdAt&sortDir=DESC
```

### 4. Get Submitted Startups (Admin)
```http
GET /startups/submitted?page=0&size=10&sortBy=createdAt&sortDir=DESC
```

### 5. Get Email Verified Startups
```http
GET /startups/email-verified?page=0&size=25&sortBy=companyName&sortDir=ASC
```

### 6. Get All Notifications
```http
GET /notifications?page=0&size=20&sortBy=id&sortDir=DESC
```

### 7. Get All Investors
```http
GET /investors?page=0&size=20&sortBy=investorId&sortDir=DESC
```

### 8. Get All Bookmarks
```http
GET /api/bookmarks?page=0&size=15&sortBy=timestamp&sortDir=DESC
```

### 9. Get All Views
```http
GET /api/views?page=0&size=50&sortBy=timestamp&sortDir=DESC
```

### 10. Get All Likes
```http
GET /api/likes?page=0&size=30&sortBy=timestamp&sortDir=DESC
```

### 11. Get All Reports
```http
GET /reports/?page=0&size=10&sortBy=timestamp&sortDir=DESC
```

### 12. Get Ranked Startups
```http
GET /api/rankings?page=0&size=10&industry=Technology&metric=overall
```

### 13. Get Top Startups
```http
GET /api/rankings/top?page=0&size=10&limit=50&industry=Technology
```

### 14. Filter Startups (Admin Review)
```http
GET /api/startups/review?status=pending&industry=tech&page=0&size=20&sortBy=createdAt&sortDir=DESC
```

---

## 🎨 Response Format
```json
{
  "content": [...],           // Your data here
  "totalPages": 5,            // Total pages available
  "totalElements": 50,        // Total items
  "size": 10,                 // Items per page
  "number": 0,                // Current page (0-indexed)
  "first": true,              // Is first page?
  "last": false,              // Is last page?
  "empty": false              // Is empty?
}
```

---

## 🔧 Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 0 | Page number (starts at 0) |
| `size` | int | 10 | Items per page |
| `sortBy` | string | varies | Field to sort by |
| `sortDir` | string | varies | `ASC` or `DESC` |

---

## 💡 Common Patterns

### Load First Page
```
?page=0&size=10
```

### Load Next Page
```
?page=1&size=10
```

### Sort Alphabetically
```
?page=0&size=10&sortBy=companyName&sortDir=ASC
```

### Sort by Date (Newest First)
```
?page=0&size=10&sortBy=createdAt&sortDir=DESC
```

### Sort by Popularity
```
?page=0&size=10&sortBy=viewsCount&sortDir=DESC
```

---

## 📱 Frontend Examples

### Fetch Function (JavaScript)
```javascript
async function fetchStartups(page = 0, size = 10) {
  const url = `/startups?page=${page}&size=${size}&sortBy=createdAt&sortDir=DESC`;
  const response = await fetch(url);
  return await response.json();
}
```

### React Hook
```javascript
const [startups, setStartups] = useState([]);
const [page, setPage] = useState(0);
const [totalPages, setTotalPages] = useState(0);

useEffect(() => {
  fetch(`/startups?page=${page}&size=10&sortBy=companyName&sortDir=ASC`)
    .then(res => res.json())
    .then(data => {
      setStartups(data.content);
      setTotalPages(data.totalPages);
    });
}, [page]);
```

### Axios (TypeScript)
```typescript
interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

async function getStartups(page = 0, size = 10): Promise<PageResponse<Startup>> {
  const { data } = await axios.get<PageResponse<Startup>>('/startups', {
    params: { page, size, sortBy: 'companyName', sortDir: 'ASC' }
  });
  return data;
}
```

---

## 🎯 Tips

1. **Start with small pages** (size=10) for better performance
2. **Use appropriate sorting** based on use case
3. **Cache responses** when possible
4. **Show loading states** during fetching
5. **Handle empty pages** gracefully

---

## ⚡ Performance

| Page Size | Response Time | Use Case |
|-----------|---------------|----------|
| 5 | ~100ms | Mobile devices |
| 10 | ~150ms | Default, balanced |
| 20 | ~250ms | Desktop tables |
| 50 | ~500ms | Data export |
| 100 | ~1000ms | Bulk operations |

---

## 🐛 Troubleshooting

**Issue:** Empty content array  
**Solution:** Check if `page` exceeds `totalPages - 1`

**Issue:** Wrong sort order  
**Solution:** Verify `sortBy` field exists in entity

**Issue:** Slow response  
**Solution:** Reduce `size` parameter

**Issue:** Page not found  
**Solution:** Ensure `page >= 0`

---

**Last Updated:** December 10, 2025  
**For detailed documentation, see:** `PAGINATION_GUIDE.md`
