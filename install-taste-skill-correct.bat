@echo off
echo ========================================
echo Installing Taste Skills for PM Dashboard
echo ========================================
echo.

echo [1/4] Installing imagegen-frontend-web...
call npx skills add Leonxlnx/taste-skill --skill imagegen-frontend-web
echo.

echo [2/4] Installing imagegen-frontend-mobile...
call npx skills add Leonxlnx/taste-skill --skill imagegen-frontend-mobile
echo.

echo [3/4] Installing high-end-visual-design...
call npx skills add https://github.com/Leonxlnx/taste-skill --skill "high-end-visual-design"
echo.

echo [4/4] Installing redesign-existing-projects...
call npx skills add https://github.com/Leonxlnx/taste-skill --skill "redesign-existing-projects"
echo.

echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Installed skills at: .agents\skills\
echo.
echo Available skills:
echo   - imagegen-frontend-web           (desktop mockups)
echo   - imagegen-frontend-mobile        (mobile mockups)
echo   - high-end-visual-design          (high-end polished mockups)
echo   - redesign-existing-projects      (design iteration)
echo.
echo Next: Use AI agent with image generation to create mockups
echo See TASTE-SKILL-SETUP.md for usage examples
echo.
pause
