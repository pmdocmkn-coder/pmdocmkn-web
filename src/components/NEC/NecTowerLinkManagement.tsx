import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Edit,
  Trash,
  ArrowLeft,
  Building2,
  Radio,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { necSignalApi } from "../../services/necSignalService";
import {
  TowerListDto,
  TowerCreateDto,
  TowerUpdateDto,
  NecLinkListDto,
  NecLinkCreateDto,
  NecLinkUpdateDto,
} from "../../types/necSignal";

const NecTowerLinkManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("towers");

  // Tower States
  const [towers, setTowers] = useState<TowerListDto[]>([]);
  const [isTowerModalOpen, setIsTowerModalOpen] = useState(false);
  const [towerModalMode, setTowerModalMode] = useState<"create" | "edit">(
    "create"
  );
  const [currentTower, setCurrentTower] = useState<TowerListDto | null>(null);
  const [towerFormData, setTowerFormData] = useState<TowerCreateDto>({
    name: "",
    location: "",
  });

  // Link States
  const [links, setLinks] = useState<NecLinkListDto[]>([]);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkModalMode, setLinkModalMode] = useState<"create" | "edit">(
    "create"
  );
  const [currentLink, setCurrentLink] = useState<NecLinkListDto | null>(null);
  const [linkFormData, setLinkFormData] = useState<NecLinkCreateDto>({
    linkName: "",
    nearEndTowerId: 0,
    farEndTowerId: 0,
    expectedRslMin: -60,
    expectedRslMax: -40,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchTowers();
    fetchLinks();
  }, []);

  const [towerSearchTerm, setTowerSearchTerm] = useState("");
  const [linkSearchTerm, setLinkSearchTerm] = useState("");
  const [selectedTower, setSelectedTower] = useState<string>("all");
  const [currentTowerPage, setCurrentTowerPage] = useState(1);
  const [currentLinkPage, setCurrentLinkPage] = useState(1);

  const towersPerPage = 10;
  const linksPerPage = 10;

  const getFilteredTowers = () => {
    if (!towerSearchTerm) return towers;
    return towers.filter(
      (t) =>
        t.name.toLowerCase().includes(towerSearchTerm.toLowerCase()) ||
        t.location?.toLowerCase().includes(towerSearchTerm.toLowerCase())
    );
  };

  const getFilteredLinks = () => {
    let filtered = links;

    // Filter by search term
    if (linkSearchTerm) {
      filtered = filtered.filter(
        (l) =>
          l.linkName.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
          l.nearEndTower
            ?.toLowerCase()
            .includes(linkSearchTerm.toLowerCase()) ||
          l.farEndTower?.toLowerCase().includes(linkSearchTerm.toLowerCase())
      );
    }

    // Filter by selected tower
    if (selectedTower !== "all") {
      filtered = filtered.filter(
        (l) =>
          l.nearEndTower === selectedTower || l.farEndTower === selectedTower
      );
    }

    return filtered;
  };

  const getPaginatedTowers = () => {
    const filtered = getFilteredTowers();
    const start = (currentTowerPage - 1) * towersPerPage;
    const end = start + towersPerPage;
    return filtered.slice(start, end);
  };

  const getPaginatedLinks = () => {
    const filtered = getFilteredLinks();
    const start = (currentLinkPage - 1) * linksPerPage;
    const end = start + linksPerPage;
    return filtered.slice(start, end);
  };

  // ============================================
  // TOWER FUNCTIONS
  // ============================================

  const fetchTowers = async () => {
    setIsLoading(true);
    try {
      const result = await necSignalApi.getTowers();
      setTowers(result || []);
    } catch (error) {
      console.error("Error fetching towers:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data tower.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openTowerModal = (mode: "create" | "edit", tower?: TowerListDto) => {
    setTowerModalMode(mode);
    if (mode === "edit" && tower) {
      setCurrentTower(tower);
      setTowerFormData({
        name: tower.name,
        location: tower.location || "",
      });
    } else {
      setCurrentTower(null);
      setTowerFormData({
        name: "",
        location: "",
      });
    }
    setIsTowerModalOpen(true);
  };

  const handleTowerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (towerModalMode === "create") {
        await necSignalApi.createTower(towerFormData);
        toast({
          title: "Berhasil",
          description: "Tower berhasil ditambahkan.",
        });
      } else {
        if (currentTower) {
          const updateDto: TowerUpdateDto = {
            id: currentTower.id,
            ...towerFormData,
          };
          await necSignalApi.updateTower(updateDto);
          toast({
            title: "Berhasil",
            description: "Tower berhasil diperbarui.",
          });
        }
      }
      setIsTowerModalOpen(false);
      fetchTowers();
    } catch (error) {
      console.error("Error saving tower:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data tower.",
        variant: "destructive",
      });
    }
  };

  const handleTowerDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus tower ini?")) {
      try {
        await necSignalApi.deleteTower(id);
        toast({
          title: "Berhasil",
          description: "Tower berhasil dihapus.",
        });
        fetchTowers();
      } catch (error) {
        console.error("Error deleting tower:", error);
        toast({
          title: "Error",
          description: "Gagal menghapus tower.",
          variant: "destructive",
        });
      }
    }
  };

  // ============================================
  // LINK FUNCTIONS
  // ============================================

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const result = await necSignalApi.getLinks();
      setLinks(result || []);
    } catch (error) {
      console.error("Error fetching links:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data link.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openLinkModal = (mode: "create" | "edit", link?: NecLinkListDto) => {
    setLinkModalMode(mode);
    if (mode === "edit" && link) {
      setCurrentLink(link);
      // ✅ FIX: Gunakan tower IDs yang ada di link
      setLinkFormData({
        linkName: link.linkName,
        nearEndTowerId: link.nearEndTowerId, // ✅ FIXED
        farEndTowerId: link.farEndTowerId, // ✅ FIXED
        expectedRslMin: link.expectedRslMin || -60,
        expectedRslMax: link.expectedRslMax || -40,
      });
    } else {
      setCurrentLink(null);
      setLinkFormData({
        linkName: "",
        nearEndTowerId: 0,
        farEndTowerId: 0,
        expectedRslMin: -60,
        expectedRslMax: -40,
      });
    }
    setIsLinkModalOpen(true);
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Auto-generate LinkName dari towers
    const nearTower = towers.find((t) => t.id === linkFormData.nearEndTowerId);
    const farTower = towers.find((t) => t.id === linkFormData.farEndTowerId);

    if (!nearTower || !farTower) {
      toast({
        title: "Error",
        description: "Tower tidak ditemukan.",
        variant: "destructive",
      });
      return;
    }

    // ✅ Generate link name otomatis
    const autoGeneratedName = `${nearTower.name} to ${farTower.name}`;

    // ✅ Use auto-generated name if user didn't provide one
    const finalLinkName = linkFormData.linkName.trim() || autoGeneratedName;

    const payload = {
      ...linkFormData,
      linkName: finalLinkName,
    };

    console.log("📤 Submitting link data:", payload);

    try {
      if (linkModalMode === "create") {
        await necSignalApi.createLink(payload);
        toast({
          title: "Berhasil",
          description: `Link "${finalLinkName}" berhasil ditambahkan.`,
        });
      } else {
        if (currentLink) {
          const updateDto: NecLinkUpdateDto = {
            id: currentLink.id,
            ...payload,
          };
          await necSignalApi.updateLink(updateDto);
          toast({
            title: "Berhasil",
            description: "Link berhasil diperbarui.",
          });
        }
      }
      setIsLinkModalOpen(false);
      fetchLinks();
    } catch (error: any) {
      console.error("❌ Error saving link:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Gagal menyimpan link.",
        variant: "destructive",
      });
    }
  };

  const handleLinkDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus link ini?")) {
      try {
        await necSignalApi.deleteLink(id);
        toast({
          title: "Berhasil",
          description: "Link berhasil dihapus.",
        });
        fetchLinks();
      } catch (error) {
        console.error("Error deleting link:", error);
        toast({
          title: "Error",
          description: "Gagal menghapus link.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="w-full p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Tower & Link NEC</h1>
        <Button onClick={() => navigate("/nec-history")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke History
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="towers">
            <Building2 className="mr-2 h-4 w-4" />
            Tower
          </TabsTrigger>
          <TabsTrigger value="links">
            <Radio className="mr-2 h-4 w-4" />
            Link
          </TabsTrigger>
        </TabsList>

        {/* TOWERS TAB */}
        <TabsContent value="towers">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Daftar Tower</CardTitle>
                <Button onClick={() => openTowerModal("create")}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Tower
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* ✅ TAMBAHKAN INI SEBELUM TABLE */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search towers..."
                    value={towerSearchTerm}
                    onChange={(e) => {
                      setTowerSearchTerm(e.target.value);
                      setCurrentTowerPage(1); // Reset to page 1
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Nama Tower</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Jumlah Link</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* ✅ PERBAIKAN: Gunakan getPaginatedTowers() */}
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-3">Memuat data...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : getPaginatedTowers().length > 0 ? (
                    getPaginatedTowers().map((tower, idx) => (
                      <TableRow key={tower.id}>
                        <TableCell>
                          {(currentTowerPage - 1) * towersPerPage + idx + 1}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {tower.name}
                        </TableCell>
                        <TableCell>{tower.location || "-"}</TableCell>
                        <TableCell>{tower.linkCount}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openTowerModal("edit", tower)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTowerDelete(tower.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-gray-500">Tidak ada data tower</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* ✅ TAMBAHKAN PAGINATION */}
              {getFilteredTowers().length > towersPerPage && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentTowerPage <= 1}
                    onClick={() => setCurrentTowerPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentTowerPage} of{" "}
                    {Math.ceil(getFilteredTowers().length / towersPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      currentTowerPage >=
                      Math.ceil(getFilteredTowers().length / towersPerPage)
                    }
                    onClick={() => setCurrentTowerPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LINKS TAB */}
        <TabsContent value="links">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Daftar Link</CardTitle>
                <Button onClick={() => openLinkModal("create")}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Link
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* ✅ SEARCH + FILTER */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search links..."
                    value={linkSearchTerm}
                    onChange={(e) => {
                      setLinkSearchTerm(e.target.value);
                      setCurrentLinkPage(1);
                    }}
                    className="pl-10"
                  />
                </div>

                {/* Tower Filter */}
                <Select
                  value={selectedTower}
                  onValueChange={(v) => {
                    setSelectedTower(v);
                    setCurrentLinkPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Tower" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Towers</SelectItem>
                    {towers.map((t) => (
                      <SelectItem key={t.id} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Nama Link</TableHead>
                    <TableHead>Near End Tower</TableHead>
                    <TableHead>Far End Tower</TableHead>
                    <TableHead>Expected RSL Min</TableHead>
                    <TableHead>Expected RSL Max</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* ✅ PERBAIKAN: Gunakan getPaginatedLinks() */}
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-3">Memuat data...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : getPaginatedLinks().length > 0 ? (
                    getPaginatedLinks().map((link, idx) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          {(currentLinkPage - 1) * linksPerPage + idx + 1}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {link.linkName}
                        </TableCell>
                        <TableCell>{link.nearEndTower}</TableCell>
                        <TableCell>{link.farEndTower}</TableCell>
                        <TableCell>{link.expectedRslMin} dBm</TableCell>
                        <TableCell>{link.expectedRslMax} dBm</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openLinkModal("edit", link)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLinkDelete(link.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-gray-500">
                          {selectedTower !== "all" || linkSearchTerm
                            ? "Tidak ada link yang sesuai dengan filter"
                            : "Tidak ada data link"}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* ✅ TAMBAHKAN PAGINATION */}
              {getFilteredLinks().length > linksPerPage && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentLinkPage <= 1}
                    onClick={() => setCurrentLinkPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentLinkPage} of{" "}
                    {Math.ceil(getFilteredLinks().length / linksPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      currentLinkPage >=
                      Math.ceil(getFilteredLinks().length / linksPerPage)
                    }
                    onClick={() => setCurrentLinkPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* TOWER MODAL */}
      <Dialog open={isTowerModalOpen} onOpenChange={setIsTowerModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {towerModalMode === "create" ? "Tambah Tower" : "Edit Tower"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTowerSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="towerName">Nama Tower *</Label>
                <Input
                  id="towerName"
                  value={towerFormData.name}
                  onChange={(e) =>
                    setTowerFormData({ ...towerFormData, name: e.target.value })
                  }
                  required
                  placeholder="Contoh: Tower A"
                />
              </div>
              <div>
                <Label htmlFor="location">Lokasi</Label>
                <Input
                  id="location"
                  value={towerFormData.location || ""}
                  onChange={(e) =>
                    setTowerFormData({
                      ...towerFormData,
                      location: e.target.value,
                    })
                  }
                  placeholder="Contoh: Jakarta Pusat"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTowerModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit">
                {towerModalMode === "create" ? "Simpan" : "Perbarui"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* LINK MODAL */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {linkModalMode === "create" ? "Tambah Link" : "Edit Link"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLinkSubmit}>
            <div className="space-y-4">
              {/* Link Name */}
              <div>
                <Label htmlFor="linkName">
                  Nama Link
                  <span className="text-xs text-gray-500 ml-2">
                    (Kosongkan untuk generate otomatis)
                  </span>
                </Label>
                <Input
                  id="linkName"
                  value={linkFormData.linkName}
                  onChange={(e) =>
                    setLinkFormData({
                      ...linkFormData,
                      linkName: e.target.value,
                    })
                  }
                  placeholder={
                    linkFormData.nearEndTowerId && linkFormData.farEndTowerId
                      ? `${towers.find(
                        (t) => t.id === linkFormData.nearEndTowerId
                      )?.name || ""
                      } to ${towers.find(
                        (t) => t.id === linkFormData.farEndTowerId
                      )?.name || ""
                      }`
                      : "Contoh: M5 to Tower Harapan"
                  }
                />
              </div>

              {/* Tower Selection - ✅ FULLY EDITABLE */}
              <div className="grid grid-cols-2 gap-4">
                {/* Near End Tower */}
                <div>
                  <Label htmlFor="nearEndTower">Near End Tower *</Label>
                  <Select
                    required
                    value={linkFormData.nearEndTowerId.toString()}
                    onValueChange={(value) => {
                      const newNearEndId = parseInt(value);
                      setLinkFormData({
                        ...linkFormData,
                        nearEndTowerId: newNearEndId,
                      });

                      // ✅ Auto-update link name jika kosong
                      if (!linkFormData.linkName.trim()) {
                        const nearTower = towers.find(
                          (t) => t.id === newNearEndId
                        );
                        const farTower = towers.find(
                          (t) => t.id === linkFormData.farEndTowerId
                        );
                        if (nearTower && farTower) {
                          setLinkFormData((prev) => ({
                            ...prev,
                            linkName: `${nearTower.name} to ${farTower.name}`,
                          }));
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tower" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" disabled>
                        Pilih Tower
                      </SelectItem>
                      {towers
                        .filter(
                          (tower) => tower.id !== linkFormData.farEndTowerId
                        ) // ✅ Prevent same tower
                        .map((tower) => (
                          <SelectItem
                            key={tower.id}
                            value={tower.id.toString()}
                          >
                            {tower.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Far End Tower */}
                <div>
                  <Label htmlFor="farEndTower">Far End Tower *</Label>
                  <Select
                    required
                    value={linkFormData.farEndTowerId.toString()}
                    onValueChange={(value) => {
                      const newFarEndId = parseInt(value);
                      setLinkFormData({
                        ...linkFormData,
                        farEndTowerId: newFarEndId,
                      });

                      // ✅ Auto-update link name jika kosong
                      if (!linkFormData.linkName.trim()) {
                        const nearTower = towers.find(
                          (t) => t.id === linkFormData.nearEndTowerId
                        );
                        const farTower = towers.find(
                          (t) => t.id === newFarEndId
                        );
                        if (nearTower && farTower) {
                          setLinkFormData((prev) => ({
                            ...prev,
                            linkName: `${nearTower.name} to ${farTower.name}`,
                          }));
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tower" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" disabled>
                        Pilih Tower
                      </SelectItem>
                      {towers
                        .filter(
                          (tower) => tower.id !== linkFormData.nearEndTowerId
                        ) // ✅ Prevent same tower
                        .map((tower) => (
                          <SelectItem
                            key={tower.id}
                            value={tower.id.toString()}
                          >
                            {tower.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Expected RSL Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expectedRslMin">Expected RSL Min (dBm)</Label>
                  <Input
                    id="expectedRslMin"
                    type="number"
                    step="0.1"
                    value={linkFormData.expectedRslMin || -60}
                    onChange={(e) =>
                      setLinkFormData({
                        ...linkFormData,
                        expectedRslMin: parseFloat(e.target.value) || -60,
                      })
                    }
                    placeholder="-60"
                  />
                </div>
                <div>
                  <Label htmlFor="expectedRslMax">Expected RSL Max (dBm)</Label>
                  <Input
                    id="expectedRslMax"
                    type="number"
                    step="0.1"
                    value={linkFormData.expectedRslMax || -40}
                    onChange={(e) =>
                      setLinkFormData({
                        ...linkFormData,
                        expectedRslMax: parseFloat(e.target.value) || -40,
                      })
                    }
                    placeholder="-40"
                  />
                </div>
              </div>

              {/* ✅ INFO: Validation Warning */}
              {linkFormData.nearEndTowerId === linkFormData.farEndTowerId &&
                linkFormData.nearEndTowerId !== 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Near End dan Far End Tower tidak boleh sama!
                    </AlertDescription>
                  </Alert>
                )}
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLinkModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  linkFormData.nearEndTowerId === 0 ||
                  linkFormData.farEndTowerId === 0 ||
                  linkFormData.nearEndTowerId === linkFormData.farEndTowerId
                }
              >
                {linkModalMode === "create" ? "Simpan" : "Perbarui"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NecTowerLinkManagement;
