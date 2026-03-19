<x-app-layout>
    <x-slot name="header">
        <h2 class="text-xl font-semibold">Gestion des permissions</h2>
    </x-slot>

    <div class="py-6">
        <div class="max-w-7xl mx-auto">
            <table class="w-full border">
                <thead>
                    <tr>
                        <th class="border p-2">Nom</th>
                        <th class="border p-2">Email</th>
                        <th class="border p-2">Rôle</th>
                        <th class="border p-2">Action</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($users as $user)
                        <tr>
                            <td class="border p-2">{{ $user->first_name }} {{ $user->last_name }}</td>
                            <td class="border p-2">{{ $user->email }}</td>
                            <td class="border p-2">{{ $user->role->name ?? 'No role' }}</td>
                            <td class="border p-2">
                                <a href="{{ route('permissions.edit', $user->id) }}" class="text-blue-500 hover:underline">
                                    Gérer permissions
                                </a>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</x-app-layout>