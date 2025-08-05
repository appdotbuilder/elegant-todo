
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Plus, Trash2, CheckCircle, Circle, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, CreateTodoInput, Priority } from '../../server/src/schema';

// Utility function for combining class names
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state for creating new todos
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null,
    due_date: null,
    priority: 'Medium'
  });

  // Filter states
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');

  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createTodo.mutate(formData);
      setTodos((prev: Todo[]) => [response, ...prev]);
      // Reset form
      setFormData({
        title: '',
        description: null,
        due_date: null,
        priority: 'Medium'
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updated = await trpc.updateTodo.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => (t.id === todo.id ? { ...t, completed: updated.completed } : t))
      );
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteTodo.mutate({ id });
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredTodos = todos.filter((todo: Todo) => {
    const priorityMatch = filterPriority === 'all' || todo.priority === filterPriority;
    const statusMatch = 
      filterStatus === 'all' || 
      (filterStatus === 'completed' && todo.completed) ||
      (filterStatus === 'pending' && !todo.completed);
    return priorityMatch && statusMatch;
  });

  const isOverdue = (dueDate: Date | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✅ Todo Master</h1>
          <p className="text-gray-600">Stay organized and productive with your personal task manager</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Circle className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{todos.filter((t: Todo) => !t.completed).length}</p>
                  <p className="text-sm text-gray-600">Pending Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{todos.filter((t: Todo) => t.completed).length}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">
                    {todos.filter((t: Todo) => !t.completed && isOverdue(t.due_date)).length}
                  </p>
                  <p className="text-sm text-gray-600">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Todo
          </Button>

          <div className="flex gap-2">
            <Select value={filterStatus || 'all'} onValueChange={(value: 'all' | 'completed' | 'pending') => setFilterStatus(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority || 'all'} onValueChange={(value: Priority | 'all') => setFilterPriority(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Add Todo Form */}
        {showAddForm && (
          <Card className="mb-6 bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-lg">Create New Todo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter todo title..."
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                    }
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Add a description (optional)..."
                    value={formData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateTodoInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={formData.priority || 'Medium'} 
                      onValueChange={(value: Priority) => 
                        setFormData((prev: CreateTodoInput) => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">🟢 Low</SelectItem>
                        <SelectItem value="Medium">🟡 Medium</SelectItem>
                        <SelectItem value="High">🔴 High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full mt-1 justify-start text-left font-normal",
                            !formData.due_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.due_date ? format(formData.due_date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.due_date || undefined}
                          onSelect={(date: Date | undefined) =>
                            setFormData((prev: CreateTodoInput) => ({ ...prev, due_date: date || null }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                    {isLoading ? 'Creating...' : 'Create Todo'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Todo List */}
        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <Card className="bg-white shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Circle className="h-16 w-16 mx-auto mb-4" />
                </div>
                <p className="text-gray-500 text-lg">
                  {todos.length === 0 
                    ? "No todos yet. Create your first task to get started! 🚀" 
                    : "No todos match your current filters."
                  }
                </p>
                {/* Note about stub usage */}
                {todos.length === 0 && (
                  <p className="text-xs text-gray-400 mt-4 bg-yellow-50 p-2 rounded border border-yellow-200">
                    📝 Note: Backend handlers are using stub implementations. 
                    Created todos will only persist during this session.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredTodos.map((todo: Todo) => (
              <Card 
                key={todo.id} 
                className={cn(
                  "bg-white shadow-sm hover:shadow-md transition-all duration-200 border-l-4",
                  todo.completed ? "opacity-75 border-l-green-400" : "border-l-blue-400",
                  isOverdue(todo.due_date) && !todo.completed && "border-l-red-400 bg-red-50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleComplete(todo)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className={cn(
                            "font-semibold text-lg",
                            todo.completed ? "line-through text-gray-500" : "text-gray-800"
                          )}>
                            {todo.title}
                          </h3>
                          
                          {todo.description && (
                            <p className={cn(
                              "mt-1 text-sm",
                              todo.completed ? "text-gray-400" : "text-gray-600"
                            )}>
                              {todo.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(todo.priority)}>
                            {todo.priority}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(todo.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        {todo.due_date && (
                          <div className={cn(
                            "flex items-center gap-1",
                            isOverdue(todo.due_date) && !todo.completed ? "text-red-600 font-medium" : ""
                          )}>
                            <CalendarIcon className="h-3 w-3" />
                            Due: {format(new Date(todo.due_date), "MMM d, yyyy")}
                            {isOverdue(todo.due_date) && !todo.completed && " (Overdue)"}
                          </div>
                        )}
                        <div>
                          Created: {new Date(todo.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
