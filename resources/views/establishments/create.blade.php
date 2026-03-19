@extends('layouts.app')

@section('content')
    <x-establishment-form
        :action="route('establishments.store')"
        submitButtonText="Créer un établissement"
    />
@endsection