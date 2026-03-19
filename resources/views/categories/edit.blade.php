@extends('layouts.app')

@section('content')
    <x-category-form
        :action="route('categories.update', $category->id)"
        submitButtonText="Mettre à jour"
        :category="$category"
    />
@endsection