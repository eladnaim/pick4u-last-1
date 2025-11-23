# Pick4U - iOS TestFlight Deployment Guide

## 🚀 הכנה לעלייה ל-TestFlight

### שלב 1: בדיקת התקנות

1. **Xcode** - ודא ש-Xcode מותקן על המחשב
2. **Apple Developer Account** - יש צורך בחשבון מפתחים של Apple
3. **App Store Connect** - גישה ל-App Store Connect

### שלב 2: הכנת הפרויקט

הפרויקט כבר מוכן עם:
- ✅ לוגו מותאם אישית
- ✅ תמיכה בעברית
- ✅ הרשאות מצלמה ומיקום
- ✅ קונפיגורציה ל-iOS

### שלב 3: בנייה וחתימה

1. **פתח את הפרויקט ב-Xcode:**
   ```bash
   cd ios/App
   open App.xcworkspace
   ```

2. **הגדרות חתימה ב-Xcode:**
   - בחר את הפרויקט Pick4U
   - עבור לכרטיסייה "Signing & Capabilities"
   - בחר את ה-team שלך
   - ודא שה-bundle identifier הוא: `com.pick4u.app`

3. **בדוק את הגדרות הפרויקט:**
   - Version: 1.0.0
   - Build: 1
   - Deployment Target: iOS 13.0+

### שלב 4: העלאה ל-TestFlight

1. **ב-Xcode:**
   - בחר Product → Archive
   - לאחר סיום ה-archive, לחץ על "Distribute App"
   - בחר "App Store Connect"
   - בחר "Upload"

2. **ב-App Store Connect:**
   - גש ל-[App Store Connect](https://appstoreconnect.apple.com)
   - בחר את האפליקציה Pick4U
   - עבור לכרטיסייה TestFlight
   - הוסף את פרטי הגרסה
   - שלח לבדיקה

### שלב 5: הוספת בודקים

1. **ב-App Store Connect:**
   - עבור לכרטיסייה TestFlight
   - בחר "Internal Testing" או "External Testing"
   - הוסף כתובות אימייל של הבודקים
   - שלח הזמנות

## 📋 דרישות מקדימות

- macOS עם Xcode 14+
- Apple Developer Program membership ($99/שנה)
- iPhone/iPad לבדיקה (אופציונלי)

## 🔧 בעיות נפוצות

1. **שגיאת חתימה** - ודא שה-team נבחר נכון
2. **Bundle ID תפוס** - בדוק שה-ID הייחודי
3. **גרסה כפולה** - העלה גרסה חדשה עם מספר build גבוה יותר

## 📱 מידע על האפליקציה

- **שם:** Pick4U
- **Bundle ID:** com.pick4u.app
- **גרסה:** 1.0.0
- **תיאור:** אפליקציה לסחר בפריטים עם תמיכה בצילום ומיקום

## 🎯 תכונות עיקריות

- 📸 צילום תמונות של פריטים
- 📍 מציאת פריטים לפי מיקום
- 💬 מערכת צ'אט
- 🔍 חיפוש חכם עם AI
- 📱 ממשק מותאם לנייד

## 📞 תמיכה

לשאלות נוספות אודות התקנה והעלאה ל-TestFlight, פנה לצוות הפיתוח.