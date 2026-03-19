@extends('layouts.app')

@section('content')
    <x-establishment-form
        :action="route('establishments.update', $establishment->id)"
        submitButtonText="Mettre à jour"
        :establishment="$establishment"
    />
@endsection