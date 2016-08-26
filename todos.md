## TODOS for V1
#### DB
- [] Publications, change query change to function
- [] Implement auth in publications
```javascript
boost.publish('/posts', function(req) {
    if (req.user) {
        return Posts.find();
    } else {
        return Boost.error('401', 'Unauthorized');
    }
});
```
- [] Adapters extend model functionality to enable setup
- [] Options for caching

#### General
- [] Authentication
- [] Error Handler
- [] SSL Generation
- [] Logging
- [] Metrics
- [] Front end event hooks (onReady, etc.)
- [] Move Dev Mode code to server if possible

## V2 Goals
- [] Meteor Conversion
- [] Google Docs CMS
- [] Migrations
