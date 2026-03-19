@extends('layouts.app')

@section('content')
    <x-category-form
        :action="route('categories.store')"
        submitButtonText="Créer une catégorie"
    />
@endsection