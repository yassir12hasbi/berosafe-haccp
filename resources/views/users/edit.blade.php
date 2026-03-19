@extends('layouts.app')

@section('content')
    <x-user-form
        :action="route('users.update', $user->id)"
        submitButtonText="Mettre à jour"
        :user="$user"
        :roles="$roles"
        :establishments="$establishments"
    />
@endsection