<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Establishment;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Category;

class DashboardController extends Controller
{
    public function index()
{
    $usersCount = User::count();
    $establishmentsCount = Establishment::count();
    $productsCount = Product::count();
    $suppliersCount = Supplier::count();
    $categoriesCount = Category::count();

    return view('dashboard', compact(
        'usersCount',
        'establishmentsCount',
        'productsCount',
        'suppliersCount',
        'categoriesCount'
    ));
}
}