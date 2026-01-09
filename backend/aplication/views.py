from django.http import JsonResponse

def hello(request):
    return JsonResponse({'message': 'Hola desde Django!'})