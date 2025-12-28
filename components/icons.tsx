import {
    ShoppingCart, Utensils, Fuel, Car, Bus, Smartphone, ShoppingBag, Store, Tv, Ticket, Home, GraduationCap, Wallet, Shield, TrendingUp, Sparkles, Stethoscope, Zap, CreditCard, Wrench, CircleDashed, Tag, Pizza, Sandwich, Coffee, Package, ShoppingBasket, Shirt, Baby, Pill, Dumbbell, Flame, Clapperboard, Music, Play, Phone, Plane, Train, Bike, Drumstick, Target, Lightbulb
} from "lucide-react";

export const ICON_MAP: Record<string, any> = {
    ShoppingCart, Utensils, Fuel, Car, Bus, Smartphone, ShoppingBag, Store, Tv, Ticket, Home, GraduationCap, Wallet, Shield, TrendingUp, Sparkles, Stethoscope, Zap, CreditCard, Wrench, CircleDashed, Tag, Pizza, Sandwich, Coffee, Package, ShoppingBasket, Shirt, Baby, Pill, Dumbbell, Flame, Clapperboard, Music, Play, Phone, Plane, Train, Bike, Drumstick, Target, Lightbulb
};

export const DynamicIcon = ({ name, color, className }: { name: string; color: string; className?: string }) => {
    const Icon = ICON_MAP[name] || Tag;
    return <Icon className={className} style={{ color }} />;
};
