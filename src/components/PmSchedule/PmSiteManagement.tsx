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
      className={`flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm group ${
        isDragging ? 'shadow-lg border-indigo-500/40 ring-2 ring-indigo-500/20 opacity-90' : 'border-indigo-500/10 hover:shadow-md transition-shadow'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div 
            {...attributes} 
            {...listeners}
            className="w-8 flex items-center justify-center text-slate-300 hover:text-indigo-500 cursor-grab active:cursor-grabbing outline-none"
          >
            <GripVertical className="w-5 h-5" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-slate-900 font-bold text-base leading-tight">{site.name}</h3>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(site)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(site.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
      {/* Search Bar Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <label className="flex flex-col min-w-40 h-12 w-full sm:max-w-md">
          <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm border border-indigo-500/20 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
            <div className="text-indigo-500 flex bg-white items-center justify-center pl-4 pr-2">
              <Search className="w-5 h-5" />
            </div>
            <input
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden text-slate-900 focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-slate-400 px-2 text-sm font-medium"
              placeholder="Search site by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </label>
        
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex h-12 px-6 w-full sm:w-auto items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white gap-2 font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:opacity-90 transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5 tracking-wide" />
          <span className="truncate">Add PM Site</span>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-indigo-500/10 shadow-sm font-medium">
              No PM Sites found.
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
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-indigo-600 text-xl font-bold">Add PM Site</DialogTitle>
            <DialogDescription className="text-slate-500">
              Create a new site/location for Preventive Maintenance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-bold text-slate-700">Site Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sangatta Hub"
                className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="rounded-xl h-11 font-bold text-slate-600 border-slate-200">
              Cancel
            </Button>
            <Button onClick={handleCreate} className="rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6">
              Create Site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-indigo-600 text-xl font-bold">Edit PM Site</DialogTitle>
            <DialogDescription className="text-slate-500">
              Update existing PM Site information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="font-bold text-slate-700">Site Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl h-11 font-bold text-slate-600 border-slate-200">
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
