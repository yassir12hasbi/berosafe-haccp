@extends('layouts.app')

@section('content')
    <x-product-form
        :action="route('products.store')"
        submitButtonText="Créer un produit"
        :categories="$categories"
        :suppliers="$suppliers"
    />
@endsection