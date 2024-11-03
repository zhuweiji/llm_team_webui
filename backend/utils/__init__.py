import random


def generate_short_id():
    population = 'abcdefghijklmnopqrstuvwxyz' + \
        'abcdefghijklmnopqrstuvwxyz'.upper() + '123456789'
    return ''.join(random.choices(population, k=6))
