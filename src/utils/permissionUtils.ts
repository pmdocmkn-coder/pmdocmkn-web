/**
 * Mengecek apakah user memiliki permission tertentu.
 * Mengambil data permissions dari localStorage.
 * 
 * @param permission Kode permission yang ingin dicek (contoh: 'role.create')
 * @returns true jika user memiliki permission tersebut, false jika tidak.
 */
export const hasPermission = (permission: string): boolean => {
    // 1. Cek User Role (Super Admin bypass semua permission)
    const userStr = localStorage.getItem("user");
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.roleName === "Super Admin") return true;
        } catch (e) {
            console.error("Error parsing user from localStorage", e);
        }
    }

    // 2. Cek Permission List
    const permissionsStr = localStorage.getItem("permissions");
    if (!permissionsStr) return false;
    try {
        const permissions: string[] = JSON.parse(permissionsStr);
        return permissions.includes(permission);
    } catch (error) {
        console.error("Error parsing permissions from localStorage:", error);
        return false;
    }
};
