import { useState, useEffect } from 'react';
import { useApp } from '../store';
import { usersApi } from '../lib/api';
import { Users, Search, Shield, User, Calendar, Mail, MoreVertical, Trash2, ShieldCheck, ShieldOff, RefreshCw, Database } from 'lucide-react';

export default function AdminUsersPage() {
  const { state, refreshUsers } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'customer'>('all');
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch users on mount and when page is visible
  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await refreshUsers();
    setLoading(false);
  };

  const users = state.dbUsers;

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      if (state.isOnline) {
        await usersApi.toggleAdmin(userId, !currentStatus);
        await refreshUsers(); // Re-fetch from DB after change
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
    setActionMenu(null);
  };

  const deleteUser = async (userId: string) => {
    if (userId === state.userId) return;
    try {
      if (state.isOnline) {
        await usersApi.delete(userId);
        await refreshUsers(); // Re-fetch from DB after delete
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
    setDeleteConfirm(null);
    setActionMenu(null);
  };

  const filteredUsers = users
    .filter(user => {
      if (filterRole === 'admin') return user.is_admin;
      if (filterRole === 'customer') return !user.is_admin;
      return true;
    })
    .filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const adminCount = users.filter(u => u.is_admin).length;
  const customerCount = users.filter(u => !u.is_admin).length;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="bg-gradient-to-r from-primary-dark to-primary text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">
              <Users size={28} /> User Accounts
            </h1>
            <p className="text-white/80 mt-1 flex items-center gap-2">
              {users.length} user(s)
              {state.isOnline && (
                <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  <Database size={10} /> Live from Aiven
                </span>
              )}
            </p>
          </div>
          <button onClick={handleRefresh} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition cursor-pointer text-sm font-medium disabled:opacity-50">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Users size={20} /></div>
              <div><p className="text-sm text-gray-500">Total Users</p><p className="text-xl font-bold text-gray-900">{users.length}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center"><Shield size={20} /></div>
              <div><p className="text-sm text-gray-500">Admins</p><p className="text-xl font-bold text-gray-900">{adminCount}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center"><User size={20} /></div>
              <div><p className="text-sm text-gray-500">Customers</p><p className="text-xl font-bold text-gray-900">{customerCount}</p></div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search users by name or email..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white" />
          </div>
          <div className="flex gap-2">
            {(['all', 'admin', 'customer'] as const).map(role => (
              <button key={role} onClick={() => setFilterRole(role)}
                className={`px-4 py-2 rounded-xl font-medium text-sm capitalize transition cursor-pointer ${
                  filterRole === role ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200'
                }`}>
                {role === 'all' ? 'All' : role + 's'}
              </button>
            ))}
          </div>
        </div>

        {/* Delete Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-fade-in-up text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={28} className="text-red-500" /></div>
              <h3 className="text-lg font-semibold mb-2">Delete User?</h3>
              <p className="text-gray-500 text-sm mb-6">This will permanently remove the user from the database.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button onClick={() => deleteUser(deleteConfirm)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 cursor-pointer">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>{users.length === 0 ? 'No users in database' : 'No users match your search'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">User</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Email</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Role</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Joined</th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user, i) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${user.is_admin ? 'bg-purple-500' : 'bg-primary'}`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{user.name}</span>
                            {user.id === state.userId && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">You</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><div className="flex items-center gap-2 text-gray-600 text-sm"><Mail size={14} />{user.email}</div></td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${user.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                          {user.is_admin ? <><Shield size={12} /> Admin</> : <><User size={12} /> Customer</>}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <Calendar size={14} />
                          {new Date(user.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="relative flex justify-end">
                          {user.id === state.userId ? (
                            <span className="text-xs text-gray-400 italic">Current</span>
                          ) : (
                            <>
                              <button onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                                <MoreVertical size={16} className="text-gray-500" />
                              </button>
                              {actionMenu === user.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border py-1 z-10 animate-fade-in-up">
                                  <button onClick={() => toggleAdminStatus(user.id, user.is_admin)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                                    {user.is_admin ? <><ShieldOff size={14} /> Remove Admin</> : <><ShieldCheck size={14} /> Make Admin</>}
                                  </button>
                                  <button onClick={() => { setDeleteConfirm(user.id); setActionMenu(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
                                    <Trash2 size={14} /> Delete User
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
