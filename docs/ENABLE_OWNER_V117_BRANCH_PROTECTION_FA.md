# تکمیل حفاظت GitHub برای قفل v117

کد و اثرانگشت تمام ۱۸۰ فایل برنامه در `main` قفل شده‌اند و CI آنها را کنترل می‌کند. اجرای واقعی قفل سطح سرور با مالک است:

1. GitHub → Salmanzadeh-ir/moulla → Settings → Rules → Rulesets → New branch ruleset.
2. Target branch: `main`؛ Require a pull request before merging؛ Require approvals و Review from Code Owners.
3. Require status checks to pass: `verify-ui-lock`؛ Do not allow bypass unless deliberately authorized by the owner.
4. Block force pushes and branch deletion.
5. Create a tag ruleset to restrict changing/deleting historical tags, especially `v10.4.9`.
6. Confirm no GitHub App or automation has bypass permissions outside owner's intent.

**توجه:** فایل‌های قفل و CI به تنهایی مانع مطلق تغییر توسط مدیر مخزن نیستند. هر تغییر جدید حتی یک پیکسل، متن، لینک، صوت، قانون یا Workflow فقط با اجازه مجزای مالک مجاز است.
