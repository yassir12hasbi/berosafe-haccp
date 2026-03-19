@extends('layouts.app')

@section('content')
    <x-supplier-form
        :action="route('suppliers.store')"
        submitButtonText="Créer un fournisseur"
    />
@endsection