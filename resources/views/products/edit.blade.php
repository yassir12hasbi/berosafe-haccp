@extends('layouts.app')

@section('content')
    <x-product-form
        :action="route('products.update', $product->id)"
        submitButtonText="Mettre à jour"
        :product="$product"
        :categories="$categories"
        :suppliers="$suppliers"
    />
@endsection