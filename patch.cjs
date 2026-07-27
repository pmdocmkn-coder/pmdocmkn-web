const fs = require('fs');

const content = fs.readFileSync('src/components/ProfilePage.tsx', 'utf-8');

const start_str = "        {/* Hero Section */}";
const end_str = "</form>";

const start_idx = content.indexOf(start_str);
const end_idx = content.indexOf(end_str) + end_str.length;

if (start_idx === -1 || content.indexOf(end_str) === -1) {
    console.error("Could not find start or end bounds.");
    process.exit(1);
}

const new_ui = `        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800 rounded-[30px] p-8 md:p-12 shadow-sm border border-slate-100 dark:border-slate-700 relative">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group/avatar">
                {hasPhoto ? (
                  <div className="size-24 md:size-28 rounded-3xl overflow-hidden cursor-pointer shadow-md bg-white p-1 transition-transform duration-300 group-hover/avatar:scale-105" onClick={() => setPreviewImage(currentUser.photoUrl!)}>
                    <img src={currentUser.photoUrl} alt={currentUser.fullName} onError={() => setPhotoError(true)} className="w-full h-full object-cover rounded-[20px]" />
                    <div className="absolute inset-1 rounded-[20px] bg-[#1B3A6B]/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                      <Eye className="text-white w-8 h-8" />
                    </div>
                  </div>
                ) : (
                  <div className="size-24 md:size-28 rounded-3xl overflow-hidden cursor-pointer shadow-md bg-white p-1 transition-transform duration-300 group-hover/avatar:scale-105" onClick={handleAvatarClick}>
                    <div className="w-full h-full rounded-[20px] bg-[#1B3A6B] flex items-center justify-center text-white text-3xl font-bold">
                      {getInitials()}
                    </div>
                    <div className="absolute inset-1 rounded-[20px] bg-[#1B3A6B]/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                      <Camera className="text-white w-8 h-8" />
                    </div>
                  </div>
                )}
                {/* Change Photo Button */}
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute -bottom-2 -right-2 bg-white size-10 rounded-full border border-gray-100 flex items-center justify-center text-[#1B3A6B] shadow-md hover:bg-gray-50 transition-colors z-20"
                  title="Ubah Foto Profil"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
              <div className="text-center md:text-left mt-2 md:mt-0">
                <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                  <h2 className="text-3xl font-extrabold text-[#1A202C] dark:text-white">{currentUser.fullName}</h2>
                  <span className="px-3 py-1 bg-blue-50 text-[#1B3A6B] font-bold text-xs rounded-full uppercase border border-blue-100">
                    {currentUser.roleName || "TEKNISI WKS"}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-[#718096] text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#1B3A6B]" />
                    {currentUser.email}
                  </span>
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#1B3A6B]" />
                    {currentUser.employeeId || "11437"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
               {isEditing ? (
                 <button type="button" onClick={() => setIsEditing(false)} className="flex-1 md:flex-none px-6 py-2.5 bg-[#1B3A6B] hover:bg-blue-900 text-white rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2">
                   Batal Edit
                 </button>
               ) : (
                 <button type="button" onClick={() => setIsEditing(true)} className="flex-1 md:flex-none px-6 py-2.5 bg-[#1B3A6B] hover:bg-blue-900 text-white rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2">
                   <Edit3 className="w-4 h-4" />
                   Edit Profile
                 </button>
               )}
               <button type="button" onClick={handleLogout} className="flex-1 md:flex-none px-6 py-2.5 bg-[#1B3A6B] hover:bg-blue-900 text-white rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2">
                 <LogOut className="w-4 h-4" />
                 Logout
               </button>
            </div>
          </div>

          <hr className="my-8 border-[#E2E8F0] dark:border-slate-700" />

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Left Column - span 2 */}
              <div className="lg:col-span-2 space-y-10">
                
                {/* Personal Info */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <User className="w-5 h-5 text-[#1B3A6B]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1A202C] dark:text-white">Personal Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#718096] uppercase tracking-wider pl-1">Full Name</label>
                      <input 
                        type="text" 
                        value={isEditing ? formData.fullName : currentUser.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-5 py-3.5 bg-[#F7F8FA] dark:bg-slate-900 border-0 rounded-2xl text-sm font-medium text-[#1A202C] dark:text-white focus:ring-2 focus:ring-[#1B3A6B] disabled:opacity-100 disabled:text-[#1A202C] disabled:bg-[#F7F8FA] transition-shadow shadow-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#718096] uppercase tracking-wider pl-1">Email Address</label>
                      <input 
                        type="email" 
                        value={isEditing ? formData.email : currentUser.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-5 py-3.5 bg-[#F7F8FA] dark:bg-slate-900 border-0 rounded-2xl text-sm font-medium text-[#1A202C] dark:text-white focus:ring-2 focus:ring-[#1B3A6B] disabled:opacity-100 disabled:text-[#1A202C] disabled:bg-[#F7F8FA] transition-shadow shadow-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#718096] uppercase tracking-wider pl-1">Division</label>
                      <div className="w-full px-5 py-3.5 bg-white dark:bg-slate-800 border-0 text-sm font-bold text-[#1A202C] dark:text-white shadow-sm rounded-2xl border border-slate-100">
                        {currentUser.division || "Outsite Pit"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#718096] uppercase tracking-wider pl-1">Employee ID</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={formData.employeeId}
                          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                          className="w-full px-5 py-3.5 bg-[#F7F8FA] dark:bg-slate-900 border-0 rounded-2xl text-sm font-medium text-[#1A202C] dark:text-white focus:ring-2 focus:ring-[#1B3A6B] transition-shadow shadow-sm" 
                        />
                      ) : (
                        <div className="w-full px-5 py-3.5 bg-[#F7F8FA] dark:bg-slate-900 border-0 rounded-2xl text-sm font-medium text-[#1A202C] dark:text-white shadow-sm">
                          {currentUser.employeeId || "11437"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Security */}
                <div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-[24px] gap-4">
                     <div className="flex items-center gap-4">
                       <div className="p-3 bg-red-50 rounded-full">
                         <Lock className="w-5 h-5 text-red-500" />
                       </div>
                       <div>
                         <h3 className="font-bold text-[#1A202C] dark:text-white text-base">Account Security</h3>
                         <p className="text-xs text-[#718096] mt-0.5">Manage your password and authentication</p>
                       </div>
                     </div>
                     <button 
                       type="button"
                       onClick={() => {
                         setIsEditing(true);
                         setIsChangingPassword(!isChangingPassword);
                       }}
                       className="px-6 py-2.5 bg-[#F7F8FA] hover:bg-blue-50 text-[#1B3A6B] font-bold text-sm rounded-full transition-colors w-full md:w-auto"
                     >
                       Change Password
                     </button>
                  </div>

                  <AnimatePresence>
                    {isChangingPassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-6 bg-[#F7F8FA] dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800"
                      >
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-[#718096] uppercase pl-1">Current Password</label>
                            <div className="relative">
                              <input
                                type={showPassword.old ? "text" : "password"}
                                value={formData.oldPassword}
                                onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                                className="w-full pr-10 pl-5 py-3 text-sm border-0 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#1B3A6B] transition-shadow shadow-sm"
                                required={isChangingPassword}
                              />
                              <button type="button" onClick={() => setShowPassword({ ...showPassword, old: !showPassword.old })} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                                {showPassword.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-[#718096] uppercase pl-1">New Password</label>
                              <div className="relative">
                                <input
                                  type={showPassword.new ? "text" : "password"}
                                  value={formData.newPassword}
                                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                  className={\`w-full pr-10 pl-5 py-3 text-sm border-0 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 transition-shadow shadow-sm \${formData.newPassword ? (passwordValidation.isValid ? 'focus:ring-green-500' : 'focus:ring-orange-500') : 'focus:ring-[#1B3A6B]'}\`}
                                  required={isChangingPassword}
                                />
                                <button type="button" onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                                  {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>

                              {formData.newPassword && (
                                <div className="mt-2 space-y-2 text-xs px-1">
                                  <div className="flex justify-between font-bold">
                                    <span>Strength: <span className={passwordValidation.strength <= 40 ? 'text-red-500' : passwordValidation.strength <= 80 ? 'text-amber-500' : 'text-green-500'}>{getStrengthText(passwordValidation.strength)}</span></span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-slate-500">
                                    <span className={passwordValidation.requirements.minLength ? 'text-green-500 font-medium' : ''}>8+ chars</span>
                                    <span className={passwordValidation.requirements.upperCase ? 'text-green-500 font-medium' : ''}>Uppercase</span>
                                    <span className={passwordValidation.requirements.lowerCase ? 'text-green-500 font-medium' : ''}>Lowercase</span>
                                    <span className={passwordValidation.requirements.numbers ? 'text-green-500 font-medium' : ''}>Number</span>
                                    <span className={passwordValidation.requirements.specialChar ? 'text-green-500 font-medium' : ''}>Special</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-[#718096] uppercase pl-1">Confirm Password</label>
                              <div className="relative">
                                <input
                                  type={showPassword.confirm ? "text" : "password"}
                                  value={formData.confirmPassword}
                                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                  className={\`w-full pr-10 pl-5 py-3 text-sm border-0 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 transition-shadow shadow-sm \${formData.confirmPassword ? (confirmPasswordMatch ? 'focus:ring-green-500' : 'focus:ring-red-500') : 'focus:ring-[#1B3A6B]'}\`}
                                  required={isChangingPassword}
                                />
                                <button type="button" onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                                  {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                              {formData.confirmPassword && (
                                <p className={\`text-xs mt-1 font-medium pl-1 \${confirmPasswordMatch ? 'text-green-600' : 'text-red-600'}\`}>
                                  {confirmPasswordMatch ? 'Passwords match' : 'Passwords do not match'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Column - span 1 */}
              <div className="space-y-10">
                 {/* Account Info */}
                 <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-50 rounded-full">
                        <Calendar className="w-5 h-5 text-[#1B3A6B]" />
                      </div>
                      <h3 className="text-lg font-bold text-[#1A202C] dark:text-white">Account Info</h3>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-bold text-[#718096] uppercase tracking-wider mb-1">Registered</p>
                        <p className="text-sm font-bold text-[#1A202C] dark:text-white">
                          {currentUser.createdAt ? (
                            (() => {
                              const date = convertUTCtoWITA(currentUser.createdAt);
                              if (!date) return "-";
                              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                              return \`\${date.getDate().toString().padStart(2, '0')} \${monthNames[date.getMonth()]} \${date.getFullYear()} pukul \${date.getHours().toString().padStart(2, '0')}.\${date.getMinutes().toString().padStart(2, '0')} WITA\`;
                            })()
                          ) : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#718096] uppercase tracking-wider mb-1">Last Login</p>
                        <p className="text-sm font-bold text-[#1A202C] dark:text-white">
                          {currentUser.lastLogin ? (
                            (() => {
                              const date = convertUTCtoWITA(currentUser.lastLogin);
                              if (!date) return "-";
                              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                              return \`\${date.getDate().toString().padStart(2, '0')} \${monthNames[date.getMonth()]} \${date.getFullYear()} pukul \${date.getHours().toString().padStart(2, '0')}.\${date.getMinutes().toString().padStart(2, '0')} WITA\`;
                            })()
                          ) : "-"}
                        </p>
                      </div>

                      <div className="pt-2">
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-xs font-bold text-[#718096] uppercase tracking-wider">Profile Completion</p>
                          <p className="text-sm font-bold text-[#1B3A6B]">{calculateProfileCompletion()}%</p>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#1B3A6B] to-[#F26425] transition-all duration-1000" style={{width: \`\${calculateProfileCompletion()}%\`}}></div>
                        </div>
                      </div>
                    </div>
                 </div>

                 {/* Active Privileges */}
                 <div className="pt-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-green-50 rounded-full">
                        <Shield className="w-5 h-5 text-green-500" />
                      </div>
                      <h3 className="text-lg font-bold text-[#1A202C] dark:text-white">Active Privileges</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="p-1 bg-green-50 rounded-full">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <span className="text-sm font-medium text-[#1A202C] dark:text-white">System Access</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-1 bg-green-50 rounded-full">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <span className="text-sm font-medium text-[#1A202C] dark:text-white">Data View Rights</span>
                      </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Bottom Save Button */}
            <div className="mt-12 flex justify-center">
              <button 
                type={isEditing ? "submit" : "button"} 
                onClick={() => { if (!isEditing) setIsEditing(true); }}
                disabled={loading || (isChangingPassword && !passwordValidation.isValid)} 
                className={\`px-12 py-4 bg-[#1B3A6B] hover:bg-blue-900 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 uppercase tracking-wider \${!isEditing && !loading ? 'opacity-90' : ''}\`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isEditing ? "Simpan Perubahan" : "Edit & Simpan"}
              </button>
            </div>
          </form>
        </div>`;

// Also update the main bg color to #F7F8FA
const replacedBackgroundContent = content.replace(
    'className="bg-background-light dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 min-h-[calc(100vh-5rem)]"',
    'className="bg-[#F7F8FA] dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 min-h-[calc(100vh-5rem)]"'
);

const new_content = replacedBackgroundContent.slice(0, start_idx) + new_ui + replacedBackgroundContent.slice(end_idx);

fs.writeFileSync('src/components/ProfilePage.tsx', new_content, 'utf-8');

console.log("Patch applied successfully.");
