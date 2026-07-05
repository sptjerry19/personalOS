<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class settingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $settings = User::where('user_id', $userId)->first();
        return response()->json($settings);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $params = $request->validate([
            'salary' => 'required|numeric',
        ]);
        $userId = $request->user()->id;
        $user = User::find($userId);
        $user->salary = $params['salary'];
        $user->save();
        return response()->json($user);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $params = $request->validate([
            'salary' => 'required|numeric',
        ]);
        $userId = $request->user()->id;
        $user = User::find($userId);
        $user->salary = $params['salary'];
        $user->save();
        return response()->json($user);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
