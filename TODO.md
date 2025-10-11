# Order Update Fix TODO

## Current Task: Fix 401 Error on Order Updates

1. [x] Standardize User query in authenticateUser (lib/api-helpers.ts) to use email for consistency with GET routes.
2. [] Restart dev server and test PATCH /api/orders/[id] via frontend edit page.
3. [] Check browser console/network for success (200) or new errors (e.g., 403 if non-admin).
4. [] If 403: Confirm user role, add self-update permission in app/api/orders/[id]/route.ts (allow limited edits if user owns order).
5. [] Test email sending on status change (if applicable).
6. [] Update frontend toast to show detailed API errors (e.g., from res.errors).
7. [] Deploy to Vercel if resolved.

## Pending/Next Steps
- User confirmation on role and exact payload if further issues.
- If stock/validation errors arise: Add frontend checks via getProducts API.

Last Updated: After auth fix implementation.
