@extends('layouts.app')

@section('content')
    <x-user-form
        :action="route('users.store')"
        submitButtonText="Créer un utilisateur"
        :roles="$roles"
        :establishments="$establishments"
    />
@endsection