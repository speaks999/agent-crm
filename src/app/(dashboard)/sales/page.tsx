'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
    Plus, X, Settings, GripVertical, Trash2, Edit2, Save, Loader2, 
    DollarSign, TrendingUp, Target, Users, BarChart3, ChevronDown,
    MoreVertical, Building2
} from 'lucide-react';
import Link from 'next/link';
import { fetchMCPData } from '@/lib/fetchMCPData';

interface Deal {
    id: string;
    name: string;
    amount?: number;
    stage: string;
    status: 'open' | 'won' | 'lost';
    pipeline_id?: string;
    account_id?: string;
    close_date?: string;
    created_at?: string;
}

interface Pipeline {
    id: string;
    name: string;
    stages: string[];
}

interface Account {
    id: string;
    name: string;
}

// Stage colors (hex values for inline styles - ensures they always work)
const STAGE_COLOR_HEX = [
    '#3B82F6', '#8B5CF6', '#06B6D4', '#10B981',
    '#F59E0B', '#F97316', '#F43F5E', '#EC4899',
    '#6366F1', '#14B8A6'
];

function getStageColorHex(index: number): string {
    return STAGE_COLOR_HEX[index % STAGE_COLOR_HEX.length];
}

// Color options for stages
const COLOR_OPTIONS = [
    { name: 'Blue', value: '#3B82F6', class: 'bg-blue-500' },
    { name: 'Purple', value: '#8B5CF6', class: 'bg-purple-500' },
    { name: 'Cyan', value: '#06B6D4', class: 'bg-cyan-500' },
    { name: 'Emerald', value: '#10B981', class: 'bg-emerald-500' },
    { name: 'Amber', value: '#F59E0B', class: 'bg-amber-500' },
    { name: 'Orange', value: '#F97316', class: 'bg-orange-500' },
    { name: 'Rose', value: '#F43F5E', class: 'bg-rose-500' },
    { name: 'Pink', value: '#EC4899', class: 'bg-pink-500' },
    { name: 'Indigo', value: '#6366F1', class: 'bg-indigo-500' },
    { name: 'Teal', value: '#14B8A6', class: 'bg-teal-500' },
];

// Pipeline Settings Modal
function PipelineSettingsModal({
    pipeline,
    onClose,
    onSave,
    onDelete,
}: {
    pipeline: Pipeline;
    onClose: () => void;
    onSave: (updated: Pipeline) => void;
    onDelete: () => void;
}) {
    const [name, setName] = useState(pipeline.name);
    const [stages, setStages] = useState<string[]>(pipeline.stages);
    const [stageColors, setStageColors] = useState<string[]>(
        pipeline.stages.map((_, i) => COLOR_OPTIONS[i % COLOR_OPTIONS.length].value)
    );
    const [newStage, setNewStage] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [colorPickerIndex, setColorPickerIndex] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch existing tag colors on mount
    useEffect(() => {
        async function loadTagColors() {
            try {
                const data = await fetchMCPData('list_tags', {});
                const tags = data.tags || [];
                
                // Start with default colors for all stages
                const newColors = pipeline.stages.map((_, i) => 
                    COLOR_OPTIONS[i % COLOR_OPTIONS.length].value
                );
                
                // Override with existing tag colors where available
                pipeline.stages.forEach((stage, index) => {
                    const tagName = `${pipeline.name} - ${stage}`;
                    const existingTag = tags.find((t: { tag_name: string; color: string }) => t.tag_name === tagName);
                    if (existingTag && existingTag.color) {
                        newColors[index] = existingTag.color;
                    }
                });
                
                setStageColors(newColors);
            } catch (err) {
                console.error('Failed to load tag colors:', err);
                // Keep default colors on error
            }
        }
        loadTagColors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pipeline.id]);

    const addStage = () => {
        if (newStage.trim() && !stages.includes(newStage.trim())) {
            setStages([...stages, newStage.trim()]);
            setStageColors([...stageColors, COLOR_OPTIONS[stages.length % COLOR_OPTIONS.length].value]);
            setNewStage('');
        }
    };

    const removeStage = (index: number) => {
        setStages(stages.filter((_, i) => i !== index));
        setStageColors(stageColors.filter((_, i) => i !== index));
        if (editingIndex === index) {
            setEditingIndex(null);
            setEditingValue('');
        }
        if (colorPickerIndex === index) {
            setColorPickerIndex(null);
        }
    };

    const moveStage = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= stages.length) return;
        
        const newStages = [...stages];
        const newColors = [...stageColors];
        [newStages[index], newStages[newIndex]] = [newStages[newIndex], newStages[index]];
        [newColors[index], newColors[newIndex]] = [newColors[newIndex], newColors[index]];
        setStages(newStages);
        setStageColors(newColors);
        
        if (editingIndex === index) {
            setEditingIndex(newIndex);
        } else if (editingIndex === newIndex) {
            setEditingIndex(index);
        }
        
        if (colorPickerIndex === index) {
            setColorPickerIndex(newIndex);
        } else if (colorPickerIndex === newIndex) {
            setColorPickerIndex(index);
        }
    };

    const startEditing = (index: number) => {
        setEditingIndex(index);
        setEditingValue(stages[index]);
        setColorPickerIndex(null);
    };

    const saveStageEdit = () => {
        if (editingIndex === null) return;
        
        const trimmedValue = editingValue.trim();
        if (!trimmedValue) {
            setEditingIndex(null);
            setEditingValue('');
            return;
        }
        
        const isDuplicate = stages.some((s, i) => i !== editingIndex && s === trimmedValue);
        if (isDuplicate) {
            setError('Stage name already exists');
            return;
        }
        
        const newStages = [...stages];
        newStages[editingIndex] = trimmedValue;
        setStages(newStages);
        setEditingIndex(null);
        setEditingValue('');
        setError(null);
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditingValue('');
    };

    const setStageColor = (index: number, color: string) => {
        const newColors = [...stageColors];
        newColors[index] = color;
        setStageColors(newColors);
        setColorPickerIndex(null);
    };

    const handleSave = async () => {
        if (!name.trim() || stages.length === 0) {
            setError('Pipeline must have a name and at least one stage');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Update pipeline
            await fetchMCPData('update_pipeline', {
                id: pipeline.id,
                name: name.trim(),
                stages,
            });

            // Update tag colors for each stage
            for (let i = 0; i < stages.length; i++) {
                const tagName = `${name.trim()} - ${stages[i]}`;
                const color = stageColors[i];
                
                // Delete old tag and create new one with updated color
                try {
                    await fetchMCPData('delete_tag', { tag_name: tagName });
                } catch (e) {
                    // Tag might not exist, that's ok
                }
                
                await fetchMCPData('create_tag', {
                    tag_name: tagName,
                    color: color,
                    entity_type: 'pipeline',
                });
            }

            onSave({ ...pipeline, name: name.trim(), stages });
        } catch (err) {
            setError('Failed to save pipeline');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="font-semibold text-foreground">Pipeline Settings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Pipeline Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Stages</label>
                        <p className="text-xs text-muted-foreground mb-2">Click the color dot to change color, or click the name to edit</p>
                        <div className="space-y-2 mb-3">
                            {stages.map((stage, index) => (
                                <div key={index} className="relative">
                                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                        {/* Color picker button */}
                                        <button
                                            onClick={() => setColorPickerIndex(colorPickerIndex === index ? null : index)}
                                            className="w-5 h-5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-muted ring-transparent hover:ring-primary/50 transition-all"
                                            style={{ backgroundColor: stageColors[index] }}
                                            title="Click to change color"
                                        />
                                        
                                        {editingIndex === index ? (
                                            <input
                                                type="text"
                                                value={editingValue}
                                                onChange={e => setEditingValue(e.target.value)}
                                                onBlur={saveStageEdit}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') saveStageEdit();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                                autoFocus
                                                className="flex-1 px-2 py-1 bg-background border border-primary rounded text-sm text-foreground focus:outline-none"
                                            />
                                        ) : (
                                            <button
                                                onClick={() => startEditing(index)}
                                                className="flex-1 text-left text-sm text-foreground hover:text-primary transition-colors"
                                                title="Click to edit name"
                                            >
                                                {stage}
                                            </button>
                                        )}
                                        
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => startEditing(index)}
                                                className="p-1 hover:bg-background rounded text-muted-foreground hover:text-primary"
                                                title="Edit stage name"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => moveStage(index, 'up')}
                                                disabled={index === 0}
                                                className="p-1 hover:bg-background rounded disabled:opacity-30"
                                                title="Move up"
                                            >
                                                <ChevronDown size={14} className="rotate-180 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() => moveStage(index, 'down')}
                                                disabled={index === stages.length - 1}
                                                className="p-1 hover:bg-background rounded disabled:opacity-30"
                                                title="Move down"
                                            >
                                                <ChevronDown size={14} className="text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() => removeStage(index)}
                                                className="p-1 hover:bg-destructive/10 rounded text-destructive"
                                                title="Delete stage"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Color picker dropdown */}
                                    {colorPickerIndex === index && (
                                        <div className="absolute left-0 top-full mt-1 p-2 bg-card border border-border rounded-lg shadow-lg z-10">
                                            <div className="grid grid-cols-5 gap-1.5">
                                                {COLOR_OPTIONS.map((color) => (
                                                    <button
                                                        key={color.value}
                                                        onClick={() => setStageColor(index, color.value)}
                                                        className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                                                            stageColors[index] === color.value ? 'ring-2 ring-offset-1 ring-foreground' : ''
                                                        }`}
                                                        style={{ backgroundColor: color.value }}
                                                        title={color.name}
                                                    />
                                                ))}
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-border">
                                                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    Custom:
                                                    <input
                                                        type="color"
                                                        value={stageColors[index]}
                                                        onChange={e => setStageColor(index, e.target.value)}
                                                        className="w-6 h-6 rounded cursor-pointer"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newStage}
                                onChange={e => setNewStage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addStage()}
                                placeholder="Add new stage..."
                                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <button
                                onClick={addStage}
                                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-border flex justify-between">
                    <button
                        onClick={onDelete}
                        className="px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                        Delete Pipeline
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Deal Card Component
function DealCard({ deal, accounts }: { deal: Deal; accounts: Account[] }) {
    const account = accounts.find(a => a.id === deal.account_id);
    
    return (
        <Link
            href={`/opportunities/${deal.id}`}
            className="block p-3 bg-card border border-border rounded-lg hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
        >
            <p className="font-medium text-foreground text-sm truncate">{deal.name}</p>
            {account && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Building2 size={10} />
                    {account.name}
                </p>
            )}
            {deal.amount && deal.amount > 0 && (
                <p className="text-sm font-semibold text-primary mt-2">
                    ${deal.amount.toLocaleString()}
                </p>
            )}
        </Link>
    );
}

// Pipeline Stage Column
function StageColumn({
    stage,
    stageIndex,
    pipelineName,
    allDeals,
    accounts,
    onMoveDeal,
}: {
    stage: string;
    stageIndex: number;
    pipelineName: string;
    allDeals: Deal[];
    accounts: Account[];
    onMoveDeal: (dealId: string, newStageTag: string) => void;
}) {
    // Stage tag format: "Pipeline Name - Stage Name"
    const stageTag = `${pipelineName} - ${stage}`;
    
    // Filter deals that match this stage tag
    const stageDeals = allDeals.filter(d => d.stage === stageTag);
    const totalValue = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-primary/5', 'border-primary/30');
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('bg-primary/5', 'border-primary/30');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-primary/5', 'border-primary/30');
        const dealId = e.dataTransfer.getData('dealId');
        if (dealId) {
            onMoveDeal(dealId, stageTag);
        }
    };

    return (
        <div
            className="flex-shrink-0 w-72 bg-muted/30 rounded-xl p-3 transition-colors border-2 border-transparent"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Stage Tag Header */}
            <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                    <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: getStageColorHex(stageIndex) }}
                    />
                    <span className="text-xs text-muted-foreground">{pipelineName}</span>
                </div>
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{stage}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {stageDeals.length}
                    </span>
                </div>
                {totalValue > 0 && (
                    <p className="text-xs text-primary font-medium mt-1">
                        ${totalValue.toLocaleString()}
                    </p>
                )}
            </div>
            
            {/* Deals List */}
            <div className="space-y-2 min-h-[80px]">
                {stageDeals.map(deal => (
                    <div
                        key={deal.id}
                        draggable
                        onDragStart={e => {
                            e.dataTransfer.setData('dealId', deal.id);
                            e.currentTarget.classList.add('opacity-50', 'scale-95');
                        }}
                        onDragEnd={e => {
                            e.currentTarget.classList.remove('opacity-50', 'scale-95');
                        }}
                        className="transition-transform"
                    >
                        <DealCard deal={deal} accounts={accounts} />
                    </div>
                ))}
                {stageDeals.length === 0 && (
                    <div className="h-16 border border-dashed border-border rounded-lg flex items-center justify-center bg-background/50">
                        <p className="text-xs text-muted-foreground">No deals</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Pipeline Board Component
function PipelineBoard({
    pipeline,
    allDeals,
    accounts,
    onUpdatePipeline,
    onDeletePipeline,
    onMoveDeal,
}: {
    pipeline: Pipeline;
    allDeals: Deal[];
    accounts: Account[];
    onUpdatePipeline: (pipeline: Pipeline) => void;
    onDeletePipeline: (id: string) => void;
    onMoveDeal: (dealId: string, newStageTag: string) => void;
}) {
    const [showSettings, setShowSettings] = useState(false);
    
    // Filter deals that belong to this pipeline (stage starts with pipeline name)
    const pipelineDeals = allDeals.filter(d => d.stage?.startsWith(`${pipeline.name} - `));
    const totalValue = pipelineDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    const openDeals = pipelineDeals.filter(d => d.status === 'open').length;

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">{pipeline.name}</h2>
                    <p className="text-sm text-muted-foreground">
                        {openDeals} open deals • ${totalValue.toLocaleString()} total value
                    </p>
                </div>
                <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <Settings size={18} className="text-muted-foreground" />
                </button>
            </div>
            
            <div className="p-4 overflow-x-auto">
                <div className="flex gap-4">
                    {pipeline.stages.map((stage, index) => (
                        <StageColumn
                            key={stage}
                            stage={stage}
                            stageIndex={index}
                            pipelineName={pipeline.name}
                            allDeals={allDeals}
                            accounts={accounts}
                            onMoveDeal={onMoveDeal}
                        />
                    ))}
                </div>
            </div>

            {showSettings && (
                <PipelineSettingsModal
                    pipeline={pipeline}
                    onClose={() => setShowSettings(false)}
                    onSave={(updated) => {
                        onUpdatePipeline(updated);
                        setShowSettings(false);
                    }}
                    onDelete={() => {
                        onDeletePipeline(pipeline.id);
                        setShowSettings(false);
                    }}
                />
            )}
        </div>
    );
}

// Create Pipeline Modal
function CreatePipelineModal({
    onClose,
    onCreate,
}: {
    onClose: () => void;
    onCreate: (pipeline: Pipeline) => void;
}) {
    const [name, setName] = useState('');
    const [stages, setStages] = useState<string[]>(['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won']);
    const [newStage, setNewStage] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addStage = () => {
        if (newStage.trim() && !stages.includes(newStage.trim())) {
            setStages([...stages, newStage.trim()]);
            setNewStage('');
        }
    };

    const removeStage = (index: number) => {
        setStages(stages.filter((_, i) => i !== index));
    };

    const handleCreate = async () => {
        if (!name.trim() || stages.length === 0) {
            setError('Pipeline must have a name and at least one stage');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const result = await fetchMCPData('create_pipeline', {
                name: name.trim(),
                stages,
            });
            const newPipeline = result.pipelines?.[0];
            if (newPipeline) {
                onCreate(newPipeline);
            }
        } catch (err) {
            setError('Failed to create pipeline');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="font-semibold text-foreground">Create Pipeline</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Pipeline Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., Enterprise Sales, SMB Pipeline"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Stages</label>
                        <div className="space-y-2 mb-3">
                            {stages.map((stage, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                    <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: getStageColorHex(index) }}
                                    />
                                    <span className="flex-1 text-sm text-foreground">{stage}</span>
                                    <button
                                        onClick={() => removeStage(index)}
                                        className="p-1 hover:bg-destructive/10 rounded text-destructive"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newStage}
                                onChange={e => setNewStage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addStage()}
                                placeholder="Add stage..."
                                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <button
                                onClick={addStage}
                                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        Create Pipeline
                    </button>
                </div>
            </div>
        </div>
    );
}

// Analytics Widget
function AnalyticsWidget({ title, value, subtext, icon: Icon, color }: {
    title: string;
    value: string;
    subtext?: string;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
                    {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
                </div>
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon size={20} className="text-white" />
                </div>
            </div>
        </div>
    );
}

export default function SalesPage() {
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [pipelinesData, dealsData, accountsData] = await Promise.all([
                fetchMCPData('list_pipelines'),
                fetchMCPData('list_deals'),
                fetchMCPData('list_accounts'),
            ]);
            setPipelines(pipelinesData.pipelines || []);
            setDeals(dealsData.deals || []);
            setAccounts(accountsData.accounts || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleUpdatePipeline = (updated: Pipeline) => {
        setPipelines(prev => prev.map(p => p.id === updated.id ? updated : p));
    };

    const handleDeletePipeline = async (id: string) => {
        try {
            await fetchMCPData('delete_pipeline', { id });
            setPipelines(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error('Failed to delete pipeline:', error);
        }
    };

    const handleMoveDeal = async (dealId: string, newStageTag: string) => {
        // Optimistic update - stage tag is in format "Pipeline Name - Stage Name"
        setDeals(prev => prev.map(d => 
            d.id === dealId ? { ...d, stage: newStageTag } : d
        ));

        try {
            await fetchMCPData('update_deal', {
                id: dealId,
                stage: newStageTag,
            });
        } catch (error) {
            console.error('Failed to move deal:', error);
            // Revert on error
            loadData();
        }
    };

    const handleCreatePipeline = (pipeline: Pipeline) => {
        setPipelines(prev => [...prev, pipeline]);
        setShowCreateModal(false);
    };

    // Analytics calculations
    const totalDeals = deals.length;
    const openDeals = deals.filter(d => d.status === 'open').length;
    const wonDeals = deals.filter(d => d.status === 'won').length;
    const totalValue = deals.reduce((sum, d) => sum + (d.amount || 0), 0);
    const wonValue = deals.filter(d => d.status === 'won').reduce((sum, d) => sum + (d.amount || 0), 0);
    const winRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;
    const avgDealSize = totalDeals > 0 ? Math.round(totalValue / totalDeals) : 0;

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Sales Pipelines</h1>
                    <p className="text-muted-foreground">Manage your sales funnels and track deals</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus size={18} />
                    New Pipeline
                </button>
            </div>

            {/* Pipelines */}
            <div className="space-y-8 mb-8">
                {pipelines.length === 0 ? (
                    <div className="bg-card border border-border rounded-xl p-12 text-center">
                        <Target size={48} className="mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No pipelines yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first sales pipeline to start tracking deals</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus size={18} />
                            Create Pipeline
                        </button>
                    </div>
                ) : (
                    pipelines.map(pipeline => (
                        <PipelineBoard
                            key={pipeline.id}
                            pipeline={pipeline}
                            allDeals={deals}
                            accounts={accounts}
                            onUpdatePipeline={handleUpdatePipeline}
                            onDeletePipeline={handleDeletePipeline}
                            onMoveDeal={handleMoveDeal}
                        />
                    ))
                )}
            </div>

            {/* Analytics Section */}
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 size={20} className="text-muted-foreground" />
                    Sales Analytics
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnalyticsWidget
                    title="Total Pipeline Value"
                    value={`$${(totalValue / 1000).toFixed(0)}k`}
                    subtext={`${totalDeals} total deals`}
                    icon={DollarSign}
                    color="bg-emerald-500"
                />
                <AnalyticsWidget
                    title="Open Deals"
                    value={openDeals.toString()}
                    subtext="Active opportunities"
                    icon={Target}
                    color="bg-blue-500"
                />
                <AnalyticsWidget
                    title="Win Rate"
                    value={`${winRate}%`}
                    subtext={`${wonDeals} deals won`}
                    icon={TrendingUp}
                    color="bg-purple-500"
                />
                <AnalyticsWidget
                    title="Avg Deal Size"
                    value={`$${avgDealSize.toLocaleString()}`}
                    subtext="Per opportunity"
                    icon={Users}
                    color="bg-amber-500"
                />
            </div>

            {/* Create Pipeline Modal */}
            {showCreateModal && (
                <CreatePipelineModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreatePipeline}
                />
            )}
        </div>
    );
}

