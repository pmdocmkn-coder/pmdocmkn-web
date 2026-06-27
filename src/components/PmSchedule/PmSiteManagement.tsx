import React, { useState, useEffect } from "react";
import { useToast } from "../../hooks/use-toast";
import { pmScheduleApi } from "../../services/pmScheduleService";
import { PmSiteDto } from "../../types/pmSchedule";
import { Plus, Edit, Trash2, Search, Server, GripVertical } from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableSiteCard({ site, onEdit, onDelete }: { site: PmSiteDto, onEdit: (s: PmSiteDto) => void, onDelete: (id: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: site.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex flex-col gap-3 rounded-[10px] border bg-white p-4 group ${
        isDragging ? 'shadow-lg border-[#2B6CB0]/40 ring-2 ring-[#2B6CB0]/20 opacity-90' : 'border-[#E2E8F0] hover:shadow-md transition-shadow'
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex gap-3 items-center">
          <div 
            {...attributes} 
            {...listeners}
            className="flex items-center justify-center text-[#E2E8F0] hover:text-[#2B6CB0] cursor-grab active:cursor-grabbing outline-none"
          >
            <GripVertical className="w-5 h-5" />
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#EBF4FF] flex items-center justify-center flex-shrink-0">
            <Server className="w-5 h-5 text-[#2B6CB0]" />
          </div>
          <h3 className="text-[#1A202C] font-semibold text-[14px]">{site.name}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(site)}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#718096] hover:text-[#2B6CB0] hover:bg-[#EBF4FF] transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(site.id)}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#718096] hover:text-[#DC2626] hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PmSiteManagement() {
  const { toast } = useToast();
  const [sites, setSites] = useState<PmSiteDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<PmSiteDto | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    orderIndex: 0,
  });

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      const data = await pmScheduleApi.getAllSites();
      setSites(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load PM Sites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSites = sites.filter((site) =>
    site.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Site Name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await pmScheduleApi.createSite({
        name: formData.name,
        orderIndex: sites.length + 1,
      });
      toast({
        title: "Success",
        description: "PM Site created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
      loadSites();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create PM Site",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedSite) return;
    if (!formData.name.trim()) return;

    try {
      await pmScheduleApi.updateSite(selectedSite.id, {
        name: formData.name,
        orderIndex: selectedSite.orderIndex,
      });
      toast({
        title: "Success",
        description: "PM Site updated successfully",
      });
      setIsEditDialogOpen(false);
      resetForm();
      loadSites();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update PM Site",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this PM Site?")) return;

    try {
      await pmScheduleApi.deleteSite(id);
      toast({
        title: "Success",
        description: "PM Site deleted successfully",
      });
      loadSites();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete PM Site",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (site: PmSiteDto) => {
    setSelectedSite(site);
    setFormData({
      name: site.name,
      orderIndex: site.orderIndex,
    });
    setIsEditDialogOpen(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = sites.findIndex((site) => site.id === active.id);
    const newIndex = sites.findIndex((site) => site.id === over.id);

    const items = arrayMove(sites, oldIndex, newIndex);

    // Update orderIndex for all items based on their new position
    const updatedItems = items.map((item, index) => ({
      ...item,
      orderIndex: index + 1
    }));

    // Optimistically update UI
    setSites(updatedItems);

    // Persist to backend
    try {
      const orders = updatedItems.map(item => ({
        id: item.id,
        orderIndex: item.orderIndex
      }));
      await pmScheduleApi.reorderSites(orders);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save the new order",
        variant: "destructive",
      });
      loadSites(); // Revert on failure
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      orderIndex: 0,
    });
    setSelectedSite(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search + Add button */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
          <input
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-[#E2E8F0] rounded-[10px] bg-[#F7F8FA] focus:outline-none focus:border-[#2B6CB0] focus:bg-white transition-colors"
            placeholder="Cari site berdasarkan nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 w-full sm:w-auto justify-center bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white text-[13px] font-semibold rounded-[10px] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add PM Site
        </button>
      </div>

      {/* Cards List with Drag and Drop */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B6CB0]"></div>
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="col-span-full text-center py-12 text-[#718096] bg-white rounded-[10px] border border-[#E2E8F0] shadow-sm font-medium">
              Belum ada site PM.
            </div>
          ) : (
            <SortableContext 
              items={filteredSites.map(s => s.id)} 
              strategy={rectSortingStrategy}
            >
              {filteredSites.map((site) => (
                <SortableSiteCard 
                  key={site.id} 
                  site={site} 
                  onEdit={openEditDialog} 
                  onDelete={handleDelete} 
                />
              ))}
            </SortableContext>
          )}
        </div>
      </DndContext>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[14px]">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A6B] text-lg font-bold">Tambah PM Site</DialogTitle>
            <DialogDescription className="text-[#718096]">
              Tambahkan site/lokasi baru untuk Preventive Maintenance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-bold text-[#1A202C]">Nama Site *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sangatta Hub"
                className="h-10 rounded-[10px] border-[#E2E8F0] focus-visible:ring-[#2B6CB0]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}
              className="rounded-[10px] h-10 font-semibold text-[#718096] border-[#E2E8F0]">
              Batal
            </Button>
            <Button onClick={handleCreate}
              className="rounded-[10px] h-10 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white font-semibold px-6">
              Create Site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[14px]">
          <DialogHeader>
            <DialogTitle className="text-[#1B3A6B] text-lg font-bold">Edit PM Site</DialogTitle>
            <DialogDescription className="text-[#718096]">
              Perbarui informasi site PM yang ada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="font-bold text-[#1A202C]">Nama Site *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10 rounded-[10px] border-[#E2E8F0] focus-visible:ring-[#2B6CB0]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}
              className="rounded-[10px] h-10 font-semibold text-[#718096] border-[#E2E8F0]">
              Batal
            </Button>
            <Button onClick={handleUpdate}
              className="rounded-[10px] h-10 bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white font-semibold px-6">
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
