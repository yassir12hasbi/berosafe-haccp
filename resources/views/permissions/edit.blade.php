<x-app-layout>

<x-slot name="header">
<h2 class="text-xl font-semibold">
Permissions : {{ $user->name }}
</h2>
</x-slot>

<div class="py-6">
<div class="max-w-4xl mx-auto bg-white p-6 shadow rounded">

<form method="POST" action="{{ route('permissions.update',$user->id) }}">
@csrf

@foreach($permissions as $permission)

<div class="mb-2">

<label class="flex items-center space-x-2">

<input
type="checkbox"
name="permissions[]"
value="{{ $permission->id }}"

{{ in_array($permission->id,$userPermissions) ? 'checked' : '' }}

>

<span>{{ $permission->name }}</span>

</label>

</div>

@endforeach

<button
type="submit"
class="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
>

Sauvegarder

</button>

</form>

</div>
</div>

</x-app-layout>