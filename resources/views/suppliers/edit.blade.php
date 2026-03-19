@extends('layouts.app')

@section('content')
    <x-supplier-form
        :action="route('suppliers.update', $supplier->id)"
        submitButtonText="Mettre à jour"
        :supplier="$supplier"
    />
@endsection